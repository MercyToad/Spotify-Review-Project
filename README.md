# SongRate

SongRate is a web application for discovering, rating, and reviewing songs using real Spotify data. It lets any visitor see a public landing page with popular tracks and a genre-based discovery section. Users can register and log in to access a personal area, where they can search songs by name, open a track’s detail (fetched from the Spotify API) and save reviews and ratings. Reviews appear immediately in the UI (client-side render) and are also persisted to the database for aggregates like average ratings and “recent reviews” widgets. Navigation includes a header with live search, a profile menu with login/logout, and an authentication modal. The app combines local data (users, songs, reviews) with Spotify metadata (titles, artists, album art) so it can display rich cover art and details without storing all external content. It’s ready to be deployed with Docker Compose (Postgres service + web service) and includes sample data for testing. Overall it provides a lightweight social experience: find music, read community opinions, and leave your own ratings to inform recommendations built from aggregated scores.

Contributors:
Adie Hofle,
Juan Marin,
David Todd, 
Nisha Iyengar, 
Aayush Sharma, 
Zack Biehl

Technology stack used in this project:
    Frontend:   Handlebars, CSS, and JavaScript
    Backend:    Node.js and Express
    Database:   Postgres

Link to the deployed application: https://spotify-review-project.onrender.com