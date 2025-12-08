/*
    This is our http api, which we use to send requests to
    our back-end API.

    @author McKilla Gorilla
*/
// THESE ARE ALL THE REQUESTS WE`LL BE MAKING, ALL REQUESTS HAVE A
// REQUEST METHOD (like get) AND PATH (like /top5list). SOME ALSO
// REQUIRE AN id SO THAT THE SERVER KNOWS ON WHICH LIST TO DO ITS
// WORK, AND SOME REQUIRE DATA, WHICH WE WE WILL FORMAT HERE, FOR WHEN
// WE NEED TO PUT THINGS INTO THE DATABASE OR IF WE HAVE SOME
// CUSTOM FILTERS FOR QUERIES
export const createPlaylist = (newListName, newSongs, userEmail) => {
    return fetch('http://localhost:4000/store/playlist/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            name: newListName,
            songs: newSongs,
            ownerEmail: userEmail
        })
    })
}
export const deletePlaylistById = (id) => fetch(`http://localhost:4000/store/playlist/${id}`, {method: 'DELETE', credentials: 'include'})
export const getPlaylistById = (id) => fetch(`http://localhost:4000/store/playlist/${id}`, {credentials: 'include'})
export const getPlaylistPairs = () => fetch(`http://localhost:4000/store/playlistpairs/`, {credentials: 'include'})
export const updatePlaylistById = (id, playlist) => {
    return fetch(`http://localhost:4000/store/playlist/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            playlist : playlist
        })
    })
}

export const getPlaylists = () => fetch(`http://localhost:4000/store/playlists`, { method: 'GET', credentials: 'include' })

export const getLoggedInPlaylists = () => fetch(`http://localhost:4000/store/playlists/user`, { method: 'GET', credentials: 'include' })

export const getFilteredSongs = (title, artist, year) => {
    return fetch(`http://localhost:4000/store/songs/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, artist, year })
    });
}

const apis = {
    createPlaylist,
    deletePlaylistById,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    getLoggedInPlaylists,
    updatePlaylistById,
    getFilteredSongs
}

export default apis
