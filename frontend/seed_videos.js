const ytSearch = require('yt-search');
const fs = require('fs');

const creators = [
  "Sneako",
  "Shneako",
  "Myron Gaines",
  "Mike Relapsed",
  "Andrew Tate",
  "Joe Rogan",
  "Chris Williamson",
  "Andrew Huberman"
];

async function run() {
  let sql = 'INSERT INTO library_videos (title, youtube_id, creator, category, duration_min, description) VALUES\n';
  const values = [];

  for (const creator of creators) {
    console.log(`Searching for ${creator}...`);
    try {
      const r = await ytSearch(`${creator} podcast`);
      const videos = r.videos.slice(0, 10);
      for (const v of videos) {
        const durationMin = v.seconds ? Math.floor(v.seconds / 60) : 10;
        const title = v.title.replace(/'/g, "''");
        const description = (v.description || v.title).replace(/'/g, "''");
        values.push(`('${title}', '${v.videoId}', '${creator}', 'MINDSET', ${durationMin}, '${description}')`);
      }
    } catch (e) {
      console.error(`Error for ${creator}:`, e.message);
    }
  }

  sql += values.join(',\n') + '\nON CONFLICT DO NOTHING;';
  fs.writeFileSync('videos.sql', sql);
  console.log('Saved to videos.sql');
}

run().catch(console.error);
