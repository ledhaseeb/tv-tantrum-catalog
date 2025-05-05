import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { TvShow } from '../shared/schema';
import { storage } from './storage';

// The ID of your spreadsheet (extract from the URL)
// For example, from https://docs.google.com/spreadsheets/d/18ivmHIO7TCJvIIXTH3A2wzG5TTaZRfqHT-tiGTC2cTg/edit
// The ID would be: 18ivmHIO7TCJvIIXTH3A2wzG5TTaZRfqHT-tiGTC2cTg
const SPREADSHEET_ID = '18ivmHIO7TCJvIIXTH3A2wzG5TTaZRfqHT-tiGTC2cTg';

// Get the sheet index (default is 0 for the first sheet)
const SHEET_INDEX = 0;

interface SensoryData {
  name: string;
  dialogueIntensity: string;
  sceneFrequency: string;
  soundEffectsLevel: string;
  musicTempo: string;
  totalMusicLevel: string;
  interactivityLevel: string;
  stimulationScore: number;
}

export class GoogleSheetsService {
  private doc: GoogleSpreadsheet;

  constructor(
    private clientEmail: string,
    private privateKey: string
  ) {
    const auth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    this.doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  }

  async initialize(): Promise<void> {
    try {
      // Load document properties and worksheets
      await this.doc.loadInfo();
      console.log(`Successfully loaded document: ${this.doc.title}`);
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error);
      throw error;
    }
  }

  async fetchSensoryData(): Promise<SensoryData[]> {
    try {
      const sheet = this.doc.sheetsByIndex[SHEET_INDEX];
      console.log(`Accessing sheet: ${sheet.title}`);

      // Load all rows from the sheet
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      console.log(`Fetched ${rows.length} rows from the spreadsheet`);

      // Map the rows to a more usable format
      return rows.map(row => {
        const getValue = (key: string): string => {
          return row.get(key) || '';
        };
        
        return {
          name: getValue('Show Name') || getValue('Name') || '',
          dialogueIntensity: getValue('Dialogue Intensity') || '',
          sceneFrequency: getValue('Scene Frequency') || '',
          soundEffectsLevel: getValue('Sound Effects Level') || '',
          musicTempo: getValue('Music Tempo') || '',
          totalMusicLevel: getValue('Total Music Level') || '',
          interactivityLevel: getValue('Interaction Level') || '',
          stimulationScore: parseInt(getValue('Stimulation Score') || '3', 10),
        };
      });
    } catch (error) {
      console.error('Error fetching data from spreadsheet:', error);
      throw error;
    }
  }

  async updateTvShowsWithSensoryData(): Promise<void> {
    try {
      const sensoryData = await this.fetchSensoryData();
      console.log(`Processing ${sensoryData.length} rows of sensory data`);

      // Get all shows from storage
      const allShows = await storage.getAllTvShows();
      let updatedCount = 0;

      // Update each show that matches by name
      for (const data of sensoryData) {
        // Skip rows without a name
        if (!data.name) continue;

        // Find matching show by name (case-insensitive)
        const matchingShow = allShows.find(
          show => show.name.toLowerCase() === data.name.toLowerCase()
        );

        if (matchingShow) {
          // Prepare update data
          const updateData: Partial<TvShow> = {
            dialogueIntensity: data.dialogueIntensity || matchingShow.dialogueIntensity,
            sceneFrequency: data.sceneFrequency || matchingShow.sceneFrequency,
            soundEffectsLevel: data.soundEffectsLevel || matchingShow.soundEffectsLevel,
            musicTempo: data.musicTempo || matchingShow.musicTempo,
            totalMusicLevel: data.totalMusicLevel || matchingShow.totalMusicLevel,
            interactivityLevel: data.interactivityLevel || matchingShow.interactivityLevel,
            stimulationScore: data.stimulationScore || matchingShow.stimulationScore,
          };

          // Update the show in storage
          await storage.updateTvShow(matchingShow.id, updateData);
          updatedCount++;
        }
      }

      console.log(`Successfully updated ${updatedCount} shows with sensory data`);
    } catch (error) {
      console.error('Error updating TV shows with sensory data:', error);
      throw error;
    }
  }
}

// Create and export a function to initialize and use the service
export async function updateTvShowsFromSpreadsheet(
  clientEmail: string, 
  privateKey: string
): Promise<void> {
  const service = new GoogleSheetsService(clientEmail, privateKey);
  
  try {
    await service.initialize();
    await service.updateTvShowsWithSensoryData();
    console.log('Successfully updated TV shows from Google Spreadsheet');
  } catch (error) {
    console.error('Failed to update TV shows from Google Spreadsheet:', error);
    throw error;
  }
}