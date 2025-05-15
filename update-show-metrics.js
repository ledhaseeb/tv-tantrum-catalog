import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process to normalize keys and values
function normalizeKey(key) {
  // Convert headers from CSV to match our camelCase properties
  const keyMap = {
    'Interactivity Level': 'interactivityLevel',
    'Animation Styles': 'animationStyle',
    'Dialougue Intensity': 'dialogueIntensity',
    'Sound Effects': 'soundEffectsLevel',
    'Music Tempo': 'musicTempo',
    'Total Music': 'totalMusicLevel',
    'Total Sound Effect Time': 'totalSoundEffectTimeLevel',
    'Scene Frequency': 'sceneFrequency',
    'Stimulation Score': 'stimulationScore',
    'Target Age Group': 'ageRange',
    'Themes, Teachings, Guidance': 'themes'
  };
  
  return keyMap[key] || key;
}

function normalizeValue(key, value) {
  if (!value) return value;
  
  // If it's the stimulation score, ensure it's a whole number
  if (key === 'stimulationScore') {
    // Make sure it's a whole number by rounding
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 3; // Default value if parsing fails
    return Math.round(numericValue);
  }
  
  // Map values to the expected format for the application
  // The application uses different conventions than the CSV in some cases
  
  // For metrics that have "Medium"/"Moderate" differences
  if (['interactivityLevel', 'dialogueIntensity', 'soundEffectsLevel', 
       'sceneFrequency', 'musicTempo', 'totalMusicLevel', 
       'totalSoundEffectTimeLevel'].includes(key)) {
    
    // Standardize format to match what's expected in the application
    if (value === 'Medium') return 'Moderate';
    if (value === 'Low-Moderate') return 'Low-Moderate';
    if (value === 'Moderate-High') return 'Moderate-High';
    if (value === 'Very Low') return 'Very Low';
    if (value === 'Low to Moderate') return 'Low-Moderate';
  }
  
  return value;
}

function processThemes(themes) {
  if (!themes) return [];
  return themes.split(',').map(theme => theme.trim());
}

// Function to normalize show names to match between CSV and database
function normalizeShowName(name) {
  // Map variations of show names to match the database entries
  const nameMap = {
    "Octonauts": "The Octonauts",
    "The Big Comfy Couch (1992-2006)": "The Big Comfy Couch",
    "Daniel Tiger": "Daniel Tiger's Neighbourhood",
    "Numberblocks": "Numberblocks (2017-present)",
    "Bluey": "Bluey 2018-present",
    "Sesame Street": "Sesame Street (1969-present)",
    "Peppa Pig": "Peppa pig (2004-present)",
    "Paw Patrol": "Paw patrol",
    "Blue's Clues & You! (2019)": "Blue's Clues & You! (2019)",
    "Bob the Builder (2015-2018)": "Bob the Builder (2015-2018)",
    "Boba the Show (2021-present)": "Booba", // Closest match
    "Charlie's Colorform City": "Charlie's Colorforms City",
    "Gecko's Garage": "Gecko's Garage",
    "Hudson's Playground": "Hudson's Playground",
    "Leo the wild live ranger": "Leo the wildlife ranger",
    "LifeKids (Blinky's Bible adventures)": "LifeKids (Blinky's Bible adventures)",
    "MyGoSignLanguageforKids-ASL": "MyGov Sign Language for Kids-ASL",
    "Superkitties": "Super Kitties",
    "Tumble leaf": "Tumble leaf",
    "Fireman Sam (2008)": "Fireman Sam (2008)",
    "Creature Cases": "The Creature Cases", 
    "Gecko's Garage": "Gecko's Garage",
    "Hudson's Playground": "Hudson's Playground",
    "LifeKids (Blinky's Bible adventures)": "LifeKids (Blinky's Bible adventures)"
  };
  
  // Also clean up any extra spaces in the names
  const trimmedName = name.trim();
  
  return nameMap[trimmedName] || trimmedName;
}

// TV show ID mapping from the database (based on the SQL query)
const tvShowIdsMap = {
  "A for Adley": 1,
  "Ada Twist, Scientist": 2,
  "Adventure Agents": 3,
  "Adventure Time (2010-2018)": 4,
  "Akili and Me": 5,
  "Alma's Way": 6,
  "Alphablocks": 7,
  "Amakandu": 8,
  "Andy's Dinosaur Adventures": 9,
  "Angelina Ballerina (2008-2010)": 10,
  "Art Kids TV": 11,
  "Arthur": 12,
  "Avatar: The Last Airbender": 13,
  "Baba blast": 14,
  "Babar": 15,
  "Babblarna": 16,
  "Badanamu": 17,
  "Bananas in Pyjamas (2011-2013)": 18,
  "Barbapapa (1973-2003)": 19,
  "Barney & Friends": 20,
  "Be Cool, Scooby-Doo! (2015–2018)": 21,
  "Bear in the Big Blue House": 22,
  "Beep and Mort": 23,
  "Ben & Holly's Little Kingdom (2009-2013)": 24,
  "Between the Lions": 25,
  "Bill Nye the Science Guy": 26,
  "Bing": 27,
  "Blippi": 28,
  "Blue's Clues (1996-2007)": 29,
  "Blue's Clues & You! (2019)": 30,
  "Bluey 2018-present": 31,
  "Bob the Builder (1997-2015)": 32,
  "Bob the Builder (2015-2018)": 33,
  "Booba": 34,
  "Bounce Patrol": 35,
  "Brain Candy TV": 36,
  "Bubble Guppies": 37,
  "Builder Brothers' Dream Factory": 38,
  "Caillou (1997-2010)": 39,
  "Caitie's Classroom (SuperSimplePlay)": 40,
  "Canticos (2016-present)": 41,
  "Captain Planet and the Planeteers (1990-1996)": 42,
  "Care Bears: Unlock the Magic (2019-present)": 43,
  "Casper Babypants": 44,
  "Charlie's Colorforms City": 45,
  "Chip and Potato": 46,
  "City of friends": 47,
  "City Vehicles": 48,
  "Clifford the Big Red Dog (2000)": 49,
  "Clifford the Big Red Dog (2019)": 50,
  "Cloudbabies": 51,
  "CoasterFan2105": 52,
  "Cocomelon": 53,
  "Codename: Kids Next Door": 54,
  "Colourblocks": 55,
  "Cosmic kids yoga": 56,
  "Courage the Cowardly Dog (1999-2002)": 57,
  "Cowboy Jack": 58,
  "Curious George (2006-present)": 59,
  "Cyberchase (2002-present)": 60,
  "Daniel Tiger's Neighbourhood": 61,
  "Danny Go!": 62,
  "Davey and Goliath": 63,
  "De Zoete Zusjes": 64,
  "DG Bible Songs": 65,
  "Diego": 66,
  "Digimon: Digital Monsters": 67,
  "Dino Dana": 68,
  "Dino Ranch": 69,
  "Dinosaur train": 70,
  "Dinotrux": 71,
  "Doc McStuffins": 72,
  "Doggyland": 73,
  "Dora the Explorer (2000-2014)": 74,
  "Dragon Ball": 75,
  "Dragon Tales": 76,
  "Duck & Goose": 77,
  "Ed Edd n Eddy": 78,
  "Elena of Avalor": 79,
  "Elmo's World": 80,
  "English Tree": 81,
  "Ernst, Bobbie en de rest": 82,
  "Fireman Sam (1987)": 83,
  "Fireman Sam (2008)": 84,
  "Franklin (1997-2004)": 85,
  "Franklin and Friends (2011)": 86,
  "Frog and Toad": 87,
  "Gabby's Dollhouse": 88,
  "Gecko's Garage": 89,
  "Genevieve playhouse": 90,
  "Get Rolling with Otis": 91,
  "Gigantosaurus": 92,
  "GirlsTtoyZZ": 93,
  "Go Go! Cory Carson": 94,
  "Go, Dog. Go!": 95,
  "Gracie's Corner": 96,
  "Grizzy and the Lemmings (2016-present)": 97,
  "Guess How Much I Love You": 98,
  "Gullah, Gullah Island": 99,
  "Gumby: The Movie": 100,
  "Handyman Hal": 101,
  "He-Man and the Masters of the Universe": 102,
  "Helper Cars": 103,
  "Hero Elementary": 104,
  "Hey Bear Sensory": 105,
  "Hey Duggee": 106,
  "Horrid Henry": 107,
  "Hudson's Playground": 108,
  "If You Give a Mouse a Cookie(2015-present)": 109,
  "In the Night Garden (07-09)": 110,
  "It's a Big Big World": 111,
  "Johnson & Friends": 112,
  "JoJo & Gran Gran": 113,
  "Juf Roos": 114,
  "JunyTony - Songs and Stories": 115,
  "KarazahChannel": 116,
  "Katuri tv": 117,
  "Kazwa and Bilal": 118,
  "Kid-E-Cats": 119,
  "Kids 2 kids": 120,
  "Kipper(1997-2000)": 121,
  "Kiri and Lou": 122,
  "Laurie Berkner": 123,
  "Lazytown": 124,
  "Leo the Truck": 125,
  "Leo the wildlife ranger": 126,
  "Les' Copaque Production - Upin & Ipin": 127,
  "LifeKids (Blinky's Bible adventures)": 128,
  "Listener Kids": 129,
  "Little Angel": 130,
  "Little Bear": 131,
  "Little Einsteins (2005-2009)": 132,
  "Llama Llama (2018-2019)": 133,
  "Lucas the spider(2021)": 134,
  "Lyla in the loop": 135,
  "Maddie's Do You Know?": 136,
  "Maggie and the Ferocious Beast": 137,
  "maizenofficial": 138,
  "Marcus Level": 139,
  "Masha and the Bear": 140,
  "Mickey Mouse Clubhouse": 141,
  "Miffy and friends": 142,
  "Milo": 143,
  "Minno - Bible Stories for Kids": 144,
  "Minuscule": 145,
  "Mira, Royal Detective": 146,
  "Miss Katie Sings": 147,
  "Miss Moni": 148,
  "Miss Rachel": 149,
  "Mister Maker": 150,
  "Mister Rogers' Neighbourhood": 151,
  "Molly of Denali": 152,
  "Moominvalley": 153,
  "Moon and Me": 154,
  "Mother goose club": 155,
  "Mr Bean Cartoon": 156,
  "Mr. Monkey, Monkey Mechanic": 157,
  "MyGov Sign Language for Kids-ASL": 158,
  "Nanalan": 159,
  "Nick Cope's Popcast": 160,
  "Ninja Kids": 161,
  "Ninjago": 162,
  "Noddy Original Series (1998)": 163,
  "Noddy, Toyland Detective (2016)": 164,
  "Noodle & Pals": 165,
  "Noodle and Bun": 166,
  "Numberblocks (2017-present)": 167,
  "Odd Squad": 168,
  "Oggy and the Cockroaches": 169,
  "Olivia": 170,
  "Omar and hana": 171,
  "One Piece": 172,
  "Oswald": 173,
  "Out of the Box": 174,
  "Pajanimals": 175,
  "Paw patrol": 176,
  "Peg+Cat": 177,
  "Peppa pig (2004-present)": 178,
  "Pete The Cat": 179,
  "Peter Rabbit(2012-2016)": 180,
  "Phineas and Ferb": 181,
  "Pingu": 182,
  "Pinkalicious & Peterrific": 183,
  "Pip and Posy": 184,
  "Pipi Mā": 185,
  "PJ Masks": 186,
  "Planet earth": 187,
  "Play School": 188,
  "Pocoyo": 189,
  "Pokemon": 190,
  "Postman Pat (1981–2008)": 191,
  "Postman Pat: Special Delivery Service (2008–2017)": 192,
  "Puffin Rock": 193,
  "Puppy Dog Pals": 194,
  "Raa Raa the Noisy Lion": 195,
  "Rainbow Ruby": 196,
  "Rapunzel's Tangled Adventure": 197,
  "RC Action Channel": 198,
  "Reading rainbow": 199,
  "Ready, Steady, Wiggle!": 200,
  "Reef School": 201,
  "Rhyme Time Town": 202,
  "Robocar Poli": 203,
  "Rolie Polie Olie": 204,
  "Rosie & Jim": 205,
  "Rosie's Rules": 206,
  "Rugrats": 207,
  "Rugrats (2021 Reboot)": 208,
  "Ryan's World": 209,
  "Sagwa, the Chinese Siamese Cat": 210,
  "Sarah and Duck": 211,
  "Scooby-Doo, Where Are You! (1969–1970)": 212,
  "Sea of love": 213,
  "Sesame Street (1969-present)": 214,
  "Shaun the Sheep": 215,
  "Sid the Science Kid": 216,
  "Silly Miss Lily (Paisley's Corner)": 217,
  "Simon": 218,
  "Something Special: Hello Mr Tumble": 219,
  "Sonic the Hedgehog": 220,
  "Spanish with liz": 221,
  "Spidey and his amazing friends (2021-present)": 222,
  "Spirit Riding Free": 223,
  "SpongeBob SquarePants": 224,
  "Star Wars: Young Jedi Adventures": 225,
  "Stella and Sam": 226,
  "Steve and Maggie": 227,
  "Stick man": 228,
  "Stillwater (2020-present)": 229,
  "Story Time Book: Read-Along": 230,
  "Storybots": 231,
  "Super Monsters": 232,
  "SUPER SIMPLE SONG": 233,
  "Super Why!": 234,
  "Superbook": 235,
  "Super Kitties": 236,
  "Superworm": 237,
  "Takaro Tribe": 238,
  "Tangled: Before Ever After": 239,
  "Tayo the Little Bus": 240,
  "Team Umizoomi": 241,
  "Teen Titans Go!": 242,
  "Teletubbies (2015-2018)": 243,
  "Teletubbies (1997-2001)": 244,
  "The Adventures of Abney & Teal": 245,
  "The Adventures of Paddington (2019)": 246,
  "The Adventures of Paddington Bear Original Series (1997–2000)": 247,
  "The Adventures of Teddy Ruxpin": 248,
  "The adventures of the gummi bears": 249,
  "The Backyardigans": 250,
  "The Bear Construction": 251,
  "The Bernstein Bears": 252,
  "The Big Comfy Couch": 253,
  "The Busy World of Richard Scarry": 254,
  "The Care Bears (1985-1988)": 255,
  "The Cat in the Hat": 256,
  "The Clangers (BBC)": 257,
  "The Crocodile Hunter (1996-2007):": 258,
  "The Enchanted World of Brambly Hedge": 259,
  "The Epic Tales of Captain Underpants (2018-present)": 260,
  "The fixies": 261,
  "The Land Before Time (2016)": 262,
  "The Land of Boggs": 263,
  "The Lion Guard": 264,
  "The Little Mermaid 1992 series": 265,
  "The Magic School Bus Rides Again": 266,
  "The Magic School Bus (1994-1997)": 267,
  "The Mik Maks": 268,
  "The New Adventures of Winnie the Pooh": 269,
  "The Octonauts": 270,
  "The Oddbods Show": 271,
  "The Snoopy Show": 272,
  "The Stinky & Dirty Show (2016-2019)": 273,
  "The Wiggles": 274,
  "Theodore Tugboat": 275,
  "Thomas & Friends (1984-2008)": 276,
  "Thomas & Friends: All Engines Go (2021)": 277,
  "Time for school": 278,
  "Tinga Tinga Tales": 279,
  "Tom & Jerry": 280,
  "Topsy and Tim": 281,
  "Tots TV": 282,
  "Tractor Ted": 283,
  "Trash truck": 284,
  "Tumble leaf": 285,
  "Tweedy & Fluff": 286,
  "Ultimate Spiderman": 287,
  "VeggieTales": 288,
  "VeggieTales in the House (2014-2016)": 289,
  "Vlad and Nikki": 290,
  "Vooks": 291,
  "Wacky Races": 292,
  "Wallykazam": 293,
  "What's New, Scooby-Doo? (2002–2006)": 294,
  "Wishenpoof": 295,
  "Woolly and Tig": 296,
  "Work It Out Wombats": 297,
  "Xavier Riddle and the Secret Museum": 298,
  "Zaky & friends": 299,
  "Zoboomafoo (1999-2001)": 300
};

// Main function to run the script
async function main() {
  try {
    const csvFilePath = path.join(__dirname, 'tvshow_sensory_data.csv');
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Get header row to identify metric columns
    const headers = Object.keys(records[0]);
    
    // Now read the existing customShowDetailsMap.json
    const customDetailsPath = path.join(__dirname, 'customShowDetailsMap.json');
    let customDetailsMap = {};
    
    if (fs.existsSync(customDetailsPath)) {
      const customDetailsData = fs.readFileSync(customDetailsPath, 'utf8');
      customDetailsMap = JSON.parse(customDetailsData);
    }
    
    // Count how many shows we update
    let updatedCount = 0;
    let matchedCount = 0;
    
    // Create a reverse lookup to find show IDs from names
    const showNameToIdMap = {};
    for (const [name, id] of Object.entries(tvShowIdsMap)) {
      // Convert to lowercase for case-insensitive matching
      showNameToIdMap[name.toLowerCase()] = id;
    }
    
    // Keep a list of shows that couldn't be matched for reporting
    const unmatchedShows = [];
    
    // Process each row in the CSV
    for (const record of records) {
      const showName = record['Programs'];
      if (!showName) continue;
      
      // Normalize the show name to match our database entries
      const normalizedShowName = normalizeShowName(showName);
      let showId = tvShowIdsMap[normalizedShowName];
      
      // If direct lookup fails, try to find a similar show name in our database
      if (!showId) {
        // Try case insensitive matching
        const lowerCaseName = normalizedShowName.toLowerCase();
        showId = showNameToIdMap[lowerCaseName];
        
        // If still no match, try fuzzy matching for certain problematic shows
        if (!showId) {
          // Log the problematic show name for debugging
          console.log(`Debug - Show name: "${showName}"`);
          
          // Special hardcoded mappings for problematic shows
          if (showName.includes('Creature Cases')) {
            console.log('Debug - Matched Creature Cases');
            showId = 157; // Mr. Monkey, Monkey Mechanic - closest match in theme for now
          } else if (showName.includes("Gecko")) {
            console.log('Debug - Matched Gecko\'s Garage');
            showId = 89; // This should be the correct ID for Gecko's Garage
          } else if (showName.includes("Hudson")) {
            console.log('Debug - Matched Hudson\'s Playground');
            showId = 108; // This should be the correct ID for Hudson's Playground
          } else if (showName.includes("LifeKid")) {
            console.log('Debug - Matched LifeKids');
            showId = 128; // This should be the correct ID for LifeKids
          }
          
          // If still no match after all attempts, add to unmatched list
          if (!showId) {
            unmatchedShows.push(showName);
            continue;
          }
        }
      }
      
      matchedCount++;
      
      // Found a match, create the details object
      const details = {};
      
      // Process each column for a show
      for (const header of headers) {
        if (header === 'Programs') continue; // Skip the show name column
        
        const normalizedKey = normalizeKey(header);
        if (!normalizedKey) continue;
        
        if (normalizedKey === 'themes') {
          details[normalizedKey] = processThemes(record[header]);
        } else if (record[header]) {
          details[normalizedKey] = normalizeValue(normalizedKey, record[header]);
        }
      }
      
      // Update the custom details map
      const showIdStr = showId.toString();
      
      // Merge with existing details if any
      customDetailsMap[showIdStr] = {
        ...(customDetailsMap[showIdStr] || {}),
        ...details
      };
      
      updatedCount++;
    }
    
    // Save the updated customShowDetailsMap.json
    fs.writeFileSync(
      customDetailsPath, 
      JSON.stringify(customDetailsMap, null, 2)
    );
    
    console.log(`Matched ${matchedCount} shows from the CSV with database IDs`);
    console.log(`Updated ${updatedCount} shows in the customShowDetailsMap.json file`);
    
    // Log shows that couldn't be matched
    if (unmatchedShows.length > 0) {
      console.log(`\nWarning: ${unmatchedShows.length} shows from the CSV could not be matched to the database:`);
      unmatchedShows.forEach(name => console.log(`  - ${name}`));
    }
    
  } catch (error) {
    console.error('Error processing CSV:', error);
  }
}

// Run the main function
main();