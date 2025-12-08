/*
    This is where we'll route all of the received http requests
    into controller response functions.
    
    @author McKilla Gorilla
*/
const express = require('express')
const StoreController = require('../controllers/store-controller')
const router = express.Router()
const auth = require('../auth')

// Playlist routes
router.post('/playlist', auth.verify, StoreController.createPlaylist)
router.delete('/playlist/:id', auth.verify, StoreController.deletePlaylist)
router.get('/playlist/:id', auth.verify, StoreController.getPlaylistById)
router.get('/playlistpairs', auth.verify, StoreController.getPlaylistPairs)
router.get('/playlists', StoreController.getPlaylists)
router.get('/playlists/user', auth.verify, StoreController.getLoggedInPlaylists)
router.put('/playlist/:id', auth.verify, StoreController.updatePlaylist)

// Song routes
router.get('/songs/playlist/:playlistId', StoreController.getSongsByPlaylist)
router.get('/songs', auth.verify, StoreController.getAllSongs)
router.get('/songs/getSongCatalog', StoreController.getSongCatalog)

module.exports = router