const auth = require('../auth')
const indexModule = require('../index'); // DB instance

// Helper function to get db instance at runtime
const getDb = () => indexModule.db;

/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.

    @author McKilla Gorilla
*/
const createPlaylist = async (req, res) => {
    try {
        // Verify user authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Validate request body
        const { name, songs } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Playlist name is required and must be a non-empty string'
            });
        }

        // Get user information
        const user = await getDb().getUser(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Create playlist data
        const playlistData = {
            name: name.trim(),
            ownerEmail: user.email,
            songs: songs || []
        };

        // Save to database
        const playlist = await getDb().createPlaylist(playlistData);

        return res.status(201).json({
            success: true,
            playlist: playlist
        });

    } catch (error) {
        console.error('Error creating playlist:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while creating playlist'
        });
    }
};

const deletePlaylist = async (req, res) => {
    try {
        // Verify user authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const playlistId = req.params.id;
        if (!playlistId) {
            return res.status(400).json({
                success: false,
                error: 'Playlist ID is required'
            });
        }

        // Get playlist to verify ownership
        const playlist = await getDb().getPlaylist(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }

        // Verify ownership
        if (playlist.ownerEmail !== (await getDb().getUser(userId)).email) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to delete this playlist'
            });
        }

        // Delete the playlist
        await getDb().deletePlaylist(playlistId);

        return res.status(200).json({
            success: true,
            message: 'Playlist deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting playlist:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while deleting playlist'
        });
    }
};

const getPlaylistById = async (req, res) => {
    try {
        const playlistId = req.params.id;
        if (!playlistId) {
            return res.status(400).json({
                success: false,
                error: 'Playlist ID is required'
            });
        }

        const playlist = await getDb().getPlaylist(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }

        return res.status(200).json({
            success: true,
            playlist: playlist
        });

    } catch (error) {
        console.error('Error getting playlist by ID:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving playlist'
        });
    }
};

const getPlaylistPairs = async (req, res) => {
    try {
        // Verify user authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Get user information
        const user = await getDb().getUser(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user's playlists
        const playlists = await getDb().getPlaylistsByOwner(user.email);

        // Convert to ID-Name pairs
        const pairs = (playlists || []).map(playlist => ({
            _id: playlist._id,
            name: playlist.name,
            username: user.username,
            ownerEmail: user.email,
            updatedAt: playlist.updatedAt
        }));

        // Sort by most recently updated
        pairs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return res.status(200).json({
            success: true,
            idNamePairs: pairs
        });

    } catch (error) {
        console.error('Error getting playlist pairs:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving playlist pairs'
        });
    }
};

const getPlaylists = async (req, res) => {
    try {
        const playlists = await getDb().getAllPlaylists();

        return res.status(200).json({
            success: true,
            data: playlists || []
        });

    } catch (error) {
        console.error('Error getting all playlists:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving playlists'
        });
    }
};

const getLoggedInPlaylists = async (req, res) => {
    try {
        const userId = auth.verifyUser(req);

        if (userId) {
            const user = await getDb().getUser(userId);
            if (user) {
                const playlists = await getDb().getPlaylistsByOwner(user.email);
                return res.status(200).json({
                    success: true,
                    data: playlists || []
                });
            }
        }

        // Return empty array for unauthenticated users
        return res.status(200).json({
            success: true,
            data: []
        });

    } catch (error) {
        console.error('Error getting logged-in playlists:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving playlists'
        });
    }
};

const updatePlaylist = async (req, res) => {
    try {
        // Verify user authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const playlistId = req.params.id;
        const { playlist: updatedPlaylist } = req.body;

        if (!playlistId) {
            return res.status(400).json({
                success: false,
                error: 'Playlist ID is required'
            });
        }

        if (!updatedPlaylist || !updatedPlaylist.name) {
            return res.status(400).json({
                success: false,
                error: 'Playlist data with name is required'
            });
        }

        // Get existing playlist
        const existingPlaylist = await getDb().getPlaylist(playlistId);
        if (!existingPlaylist) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }

        // Verify ownership
        const user = await getDb().getUser(userId);
        if (existingPlaylist.ownerEmail !== user.email) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this playlist'
            });
        }

        // Update playlist
        const playlistUpdate = {
            name: updatedPlaylist.name.trim(),
            songs: updatedPlaylist.songs || []
        };

        const updated = await getDb().updatePlaylist(playlistId, playlistUpdate);

        return res.status(200).json({
            success: true,
            id: updated._id,
            message: 'Playlist updated successfully'
        });

    } catch (error) {
        console.error('Error updating playlist:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while updating playlist'
        });
    }
};

const getSongsByPlaylist = async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        if (!playlistId) {
            return res.status(400).json({
                success: false,
                error: 'Playlist ID is required'
            });
        }

        const playlist = await getDb().getPlaylist(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }

        return res.status(200).json({
            success: true,
            playlist: playlist
        });

    } catch (error) {
        console.error('Error getting songs by playlist:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving playlist songs'
        });
    }
};

const getSongCatalog = async (req, res) => {
    try {
        const songs = await getDb().filterSongCatalog(req.query);

        return res.status(200).json({
            success: true,
            songs: songs || []
        });

    } catch (error) {
        console.error('Error getting song catalog:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving song catalog'
        });
    }
};

const getAllSongs = async (req, res) => {
    try {
        const songs = await getDb().getAllSongs();

        return res.status(200).json({
            success: true,
            songs: songs || []
        });

    } catch (error) {
        console.error('Error getting all songs:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving songs'
        });
    }
};

const incrementSongListen = async (req, res) => {
    try {
        const { playlistId, youTubeId, title, artist, year } = req.body;

        // Allow null playlistId for catalog plays
        if (playlistId !== null && playlistId !== undefined && !playlistId) {
            return res.status(400).json({
                success: false,
                error: 'Playlist ID is required for playlist plays'
            });
        }

        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({
                success: false,
                error: 'YouTube ID or both title and artist are required'
            });
        }

        const updatedSong = await getDb().incrementSongListen(playlistId, youTubeId, title, artist, year);

        return res.status(200).json({
            success: true,
            song: updatedSong
        });

    } catch (error) {
        console.error('Error incrementing song listen:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while updating song listen count'
        });
    }
};

const incrementSongPlaylistCount = async (req, res) => {
    try {
        const { youTubeId, title, artist, year } = req.body;

        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({
                success: false,
                error: 'YouTube ID or both title and artist are required'
            });
        }

        const updatedSong = await getDb().incrementSongPlaylistCount(youTubeId, title, artist, year);

        return res.status(200).json({
            success: true,
            song: updatedSong
        });

    } catch (error) {
        console.error('Error incrementing song playlist count:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while updating song playlist count'
        });
    }
};

const deleteSong = async (req, res) => {
    try {
        // Verify user authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { youTubeId, title, artist, year } = req.body;

        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({
                success: false,
                error: 'YouTube ID or both title and artist are required'
            });
        }

        const result = await getDb().deleteSong(youTubeId, title, artist, year);

        return res.status(200).json({
            success: true,
            deletedCount: result.deletedCount || 0
        });

    } catch (error) {
        console.error('Error deleting song:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while deleting song'
        });
    }
};

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    getLoggedInPlaylists,
    updatePlaylist,
    getSongsByPlaylist,
    getSongCatalog,
    getAllSongs,
    incrementSongListen,
    incrementSongPlaylistCount,
    deleteSong,
}