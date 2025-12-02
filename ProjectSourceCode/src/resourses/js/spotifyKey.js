var SPOTIFY_CLIENT_ID = "b7e7b777ce794d438de69b4eb18536c0"; 
var SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";


async function refreshSpotifyToken() {
    console.log("Attempting to refresh Spotify token...");

    var refreshToken = localStorage.getItem('refresh_token');

    // the data to send
    var params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', SPOTIFY_CLIENT_ID);

    try {
        // Send the POST request
        var response = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        var data = await response.json();

        // Save the new keys if they exist
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
        }
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }

        return data.access_token;

    } catch (error) {
        console.error("Error: Could not refresh token.", error);
        return null;
    }
}

async function makeSpotifyRequest(url, options) {
    // Initialize options if they were not provided
    if (!options) {
        options = {};
    }
    if (!options.headers) {
        options.headers = {};
    }

    // Get the current token and attach it to the header
    var token = localStorage.getItem('access_token');
    options.headers['Authorization'] = 'Bearer ' + token;

    // Try the request for the first time
    var response = await fetch(url, options);

    // Check if the server rejected because the token is old (401)
    if (response.status === 401) {
        console.warn("Server said 401 Unauthorized. Token might be expired.");

        // Call helper to get a new token
        var newToken = await refreshSpotifyToken();

        if (newToken) {
            console.log("Token refreshed successfully. Retrying original request...");
            
            // Update the header with the new token
            options.headers['Authorization'] = 'Bearer ' + newToken;
            
            // Retry the request
            response = await fetch(url, options);
        }
    }

    // Return the final response (either the success, or the error if retry failed)
    return response;
}