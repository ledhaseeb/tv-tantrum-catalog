import { Octokit } from "octokit";
import { TvShowGitHub, tvShowGitHubSchema } from "@shared/schema";

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private dataPath: string;

  constructor(
    githubToken?: string,
    owner: string = "ledhaseeb",
    repo: string = "tvtantrum",
    dataPath: string = "database"
  ) {
    this.octokit = new Octokit({ auth: githubToken });
    this.owner = owner;
    this.repo = repo;
    this.dataPath = dataPath;
  }

  async fetchTvShowsData(): Promise<TvShowGitHub[]> {
    try {
      // Get the specific reviewed_shows.json file as mentioned by user
      const reviewedShowsPath = `${this.dataPath}/reviewed_shows.json`;
      console.log(`Fetching TV shows data from GitHub: ${this.owner}/${this.repo}/${reviewedShowsPath}`);
      
      const { data: fileContent } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: reviewedShowsPath,
      });

      // Process file content
      const showsData: TvShowGitHub[] = [];
      
      if ("content" in fileContent && typeof fileContent.content === "string") {
        // Decode Base64 content
        const content = Buffer.from(fileContent.content, "base64").toString();
        
        try {
          // Parse and validate JSON
          const jsonData = JSON.parse(content);
          
          // If it's an array, process each item as a show
          if (Array.isArray(jsonData)) {
            console.log(`Found ${jsonData.length} shows in reviewed_shows.json`);
            for (const item of jsonData) {
              const validatedShow = this.validateTvShow(item);
              if (validatedShow) {
                // Images are stored directly by filename in the data
                validatedShow.imageUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/client/public/images/${validatedShow.image_filename}`;
                showsData.push(validatedShow);
              }
            }
          } else {
            // It's a single show object
            const validatedShow = this.validateTvShow(jsonData);
            if (validatedShow) {
              // Images are stored directly by filename in the data
              validatedShow.imageUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/client/public/images/${validatedShow.image_filename}`;
              showsData.push(validatedShow);
            }
          }
        } catch (error) {
          console.error(`Error parsing JSON from ${reviewedShowsPath}:`, error);
        }
      }

      return showsData;
    } catch (error) {
      console.error("Error fetching TV shows data from GitHub:", error);
      throw new Error(`Failed to fetch TV shows data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateTvShow(data: any): TvShowGitHub | null {
    try {
      return tvShowGitHubSchema.parse(data);
    } catch (error) {
      console.error("Invalid TV show data:", error);
      return null;
    }
  }
}

// Create and export a singleton instance
export const githubService = new GitHubService(
  process.env.GITHUB_TOKEN
);
