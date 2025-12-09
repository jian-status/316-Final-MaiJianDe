const { Sequelize, DataTypes, Model } = require('sequelize');
const DatabaseManager = require("../index.js");
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Ensure environment variables are loaded
dotenv.config();

const sequelize = new Sequelize('playlister', 'postgres', 'jian', {
  host: process.env.SEQUELIZE_HOST || 'localhost',
  dialect: process.env.SEQUELIZE_DIALECT || 'postgres',
  port: process.env.SEQUELIZE_PORT || 5432,
  logging: false, // Disable SQL logging in terminal
});

class User extends Model {}

User.init({
  _id: {
    type: DataTypes.STRING, // Let primary id be a string for mongodb compatibility
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  username: {
    type: DataTypes.STRING,
    field: 'Username',
    allowNull: false
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false,
    field: 'Email',
    unique: true,
    allowNull: false
  },
  passwordHash: { 
    type: DataTypes.STRING,
    field: 'PasswordHash',
    allowNull: false 
  }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true
});

class Song extends Model {}

Song.init({
  title: { 
    type: DataTypes.TEXT,
    allowNull: false 
  },
  artist: { 
    type: DataTypes.TEXT,
    allowNull: false 
  },
  year: { 
    type: DataTypes.INTEGER
  },
  youTubeId: { 
    type: DataTypes.TEXT
  },
  ownerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  listens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  playlistCount: {
    type: DataTypes.INTEGER,
    field: 'PlaylistCount',
    allowNull: false,
    defaultValue: 0
  },
  playlistId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Playlists',
      key: '_id'
    }
  }
}, { 
  sequelize, 
  modelName: 'Song'
});

class Playlist extends Model {}

Playlist.init({
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    field: 'Name',
    allowNull: false,
  },
  ownerEmail: {
    type: DataTypes.STRING,
    field: 'OwnerEmail',
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Playlist',
  timestamps: true
});

// Playlist-Song associations
Playlist.hasMany(Song, { 
  foreignKey: 'playlistId',
  as: 'songs'
});
Song.belongsTo(Playlist, { 
  foreignKey: 'playlistId' 
});

module.exports = { sequelize };

async function authenticate() {
  return await sequelize.authenticate();
}

class PostgresManager extends DatabaseManager {

  constructor() {
    super();
    this.connection = this.connect();
  }

  async connect() {
    try {
      await authenticate();
      return sequelize;
    } catch (e) {
      console.error('Failed to connect to PostgreSQL DB', e.message);
      throw e;
    }
  }

  async dropTable(model, name) {
    try {
      await model.drop();
    } catch (err) {
    }
  }

  async fillTable(model, name, data) {
    try {
      // Normalize incoming test data for the User model
      let normalized = data;
      if (name === 'User') {
        normalized = await Promise.all(data.map(async (u) => {
          const username = u.username || u.name || u.Name || u.user || u.email || 'user';
          const passwordHash = u.passwordHash || await bcrypt.hash('password', 10);
          return { username: username, email: u.email, passwordHash };
        }));
      }
      await model.bulkCreate(normalized);
    } catch (err) {
    }
  }

  async fillSongs(testData) {
    try {
      const playlists = await Playlist.findAll();
      for (const data of testData.playlists) {
        const res = playlists.find((p) => p.name === data.name);
        if (res && data.songs) {
          
          const songs = data.songs.map((song) => ({
            ...song,
            playlistId: res._id,
            ownerEmail: res.ownerEmail // set song owner to playlist owner when seeding
          }));
          await Song.bulkCreate(songs);
        }
      }
    } catch (err) {
    }
  }

  async resetDB() {
    const testData = require("../../test/data/PlaylisterData.json");
    
    await this.dropTable(Song, "Songs");
    await this.dropTable(Playlist, "Playlists");
    await this.dropTable(User, "Users");

    const sequelize = await this.connection;
    await sequelize.sync(); // Rebuild db tables

    await this.fillTable(User, "User", testData.users);
    await this.fillTable(Playlist, "Playlist", testData.playlists);
    await this.fillSongs(testData);
  }

  async getUser(userId) {
    try {
      return await User.findByPk(userId);
    } catch (err) {
      console.error("Could not get user:", err.message);
      throw err;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ where: { email: email } });
    } catch (err) {
      console.error("Could not get user by email:", err.message);
      throw err;
    }
  }

  async createUser(userData) {
    try {
      return await User.create(userData);
    } catch (err) {
      console.error("Could not create user:", err.message);
      throw err;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("deleteUser: Could not find user");
      }
      return await user.destroy();
    } catch (err) {
      console.error("Could not delete user:", err.message);
      throw err;
    }
  }

  async updateUser(userId, newData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
          throw new Error("updateUser: Could not find user");
      }
      await user.update(newData);
      return user
    }
    catch(err) {
      console.error("Could not update user:", err.message);
      throw err;
    }
  }

  async getPlaylist(playlistId) {
    try {
      const playlist = await Playlist.findByPk(playlistId, {
        include: [{
          model: Song,
          as: 'songs'
        }],
        order: [[{ model: Song, as: 'songs' }, 'id', 'ASC']]
      });
      
      if (playlist) {
        // Convert to plain JSON to ensure songs are included
        const plainPlaylist = playlist.toJSON();
        
        // Update each song's playlistCount from the global Song table
        if (plainPlaylist.songs && plainPlaylist.songs.length > 0) {
          for (let i = 0; i < plainPlaylist.songs.length; i++) {
            const song = plainPlaylist.songs[i];
            const whereClause = {};
            
            if (song.youTubeId) {
              whereClause.youTubeId = song.youTubeId;
            } else if (song.title && song.artist) {
              whereClause.title = song.title;
              whereClause.artist = song.artist;
              if (song.year !== undefined && song.year !== null) {
                whereClause.year = song.year;
              }
            }
            
            // Find any similar song instances
            const anySongInstance = await Song.findOne({ where: whereClause });
            if (anySongInstance) {
              plainPlaylist.songs[i].playlistCount = anySongInstance.playlistCount;
            }
          }
        }
        
        return plainPlaylist;
      }
      
      return playlist;
    } catch (err) {
      console.error("Could not get playlist:", err.message);
      throw err;
    }
  }

  async getPlaylistsByOwner(ownerEmail) {
    try {
      const playlists = await Playlist.findAll({ 
        where: { ownerEmail: ownerEmail },
        include: [{
          model: Song,
          as: 'songs'
        }]
      });
      playlists.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      return playlists;
    } catch (err) {
      console.error("Could not get playlists by owner:", err.message);
      throw err;
    }
  }

  async deletePlaylist(playlistId) {
    try {
      const playlist = await Playlist.findByPk(playlistId);
      if (!playlist) {
        throw new Error("deletePlaylist: Could not find playlist");
      }
      // Before deleting the playlist, find unique songs and decrement their global playlist count
      const songs = await Song.findAll({ where: { playlistId: playlistId } });
      const unique = new Map();
      for (const s of songs) {
        const key = `${s.title}-${s.artist}-${s.year || ''}`;
        if (!unique.has(key)) unique.set(key, s);
      }
      for (const s of unique.values()) {
        try {
          await this.decrementSongPlaylistCount(s.youTubeId, s.title, s.artist, s.year);
        } catch (err) {
          console.error('Error decrementing playlist count during deletePlaylist:', err.message);
        }
      }
      // Now destroy the playlist and its songs
      return await playlist.destroy();
    } catch (err) {
      console.error("Could not delete playlist:", err.message);
      throw err;
    }
  }

  async createPlaylist(data) {
    try {
      const { songs, ...playlistData } = data;
      const playlist = await Playlist.create(playlistData);      
      if (songs && songs.length > 0) {
        const newSongs = [];
        const uniqueSongs = new Map();
        
        
        for (const songData of songs) {
          let year = null;
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not create playlist: Year must be a valid integer.`);
            }
            year = parsedYear;
          }
          
          const songKey = `${songData.title}-${songData.artist}-${year || ''}`;
          
          // Add the song to this playlist
          newSongs.push({
            title: songData.title,
            artist: songData.artist,
            year: year,
            youTubeId: songData.youTubeId,
            playlistId: playlist._id,
            ownerEmail: songData.ownerEmail || playlist.ownerEmail
          });
          
          // Track for playlist count increment (only count unique songs)
          if (!uniqueSongs.has(songKey)) {
            uniqueSongs.set(songKey, { ...songData, year: year });
          }
        }
                
        if (newSongs.length > 0) {
          await Song.bulkCreate(newSongs);
        }
        
        // Avoid race condition
        for (const songData of uniqueSongs.values()) {
          try {
            const result = await this.incrementSongPlaylistCount(
              songData.youTubeId, 
              songData.title, 
              songData.artist, 
              songData.year
            );
          } catch (err) {
            console.error('Error incrementing playlist count:', err.message, err);
          }
        }
      }
      
      // Refetch the playlist with updated song counts
      const finalPlaylist = await this.getPlaylist(playlist._id);
      return finalPlaylist || playlist;

    } catch (err) {
      console.error("Could not create playlist:", err.message);
      throw err;
    }
  }

  async updatePlaylist(listId, newData) {
    try {
      const playlist = await Playlist.findByPk(listId);
      if (!playlist) {
        throw new Error("updatePlaylist: Could not find playlist");
      }
      
      const { songs, ...newPlaylist } = newData;
      await playlist.update(newPlaylist);
      
      if (songs) {
        const currentSongs = await Song.findAll({ where: { playlistId: listId } });
        const currentUnique = new Map();
        for (const s of currentSongs) {
          const key = `${s.title}-${s.artist}-${s.year || ''}`;
          if (!currentUnique.has(key)) currentUnique.set(key, s);
        }

        const newSongs = [];
        const newUnique = new Map();
        for (const songData of songs) {
          let year = null;
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not update playlist: Year must be a valid integer.`);
            }
            year = parsedYear;
          }
          
          const songKey = `${songData.title}-${songData.artist}-${year || ''}`;
          const existingSong = currentUnique.get(songKey);
          newSongs.push({
            title: songData.title,
            artist: songData.artist,
            year: year,
            youTubeId: songData.youTubeId,
            playlistId: listId,
            ownerEmail: songData.ownerEmail || playlist.ownerEmail,
            playlistCount: existingSong ? existingSong.playlistCount : 0,
            listens: existingSong ? existingSong.listens : 0
          });
          if (!newUnique.has(songKey)) newUnique.set(songKey, songData);
        }
        
        const removedKeys = [];
        for (const key of currentUnique.keys()) {
          if (!newUnique.has(key)) removedKeys.push(key);
        }
        const addedKeys = [];
        for (const key of newUnique.keys()) {
          if (!currentUnique.has(key)) addedKeys.push(key);
        }

        for (const key of removedKeys) {
          const s = currentUnique.get(key);
          try {
            await this.decrementSongPlaylistCount(s.youTubeId, s.title, s.artist, s.year);
          } catch (err) {
            console.error('Error decrementing playlist count for removed song', err.message);
          }
        }

        await Song.destroy({ where: { playlistId: listId } });

        if (newSongs.length > 0) {
          await Song.bulkCreate(newSongs);
        }

        for (const key of newUnique.keys()) {
          const sd = newUnique.get(key);
          try {
            let whereClause = {};
            if (sd.youTubeId) {
              whereClause.youTubeId = sd.youTubeId;
            } else if (sd.title && sd.artist) {
              whereClause.title = sd.title;
              whereClause.artist = sd.artist;
              if (sd.year !== undefined) whereClause.year = sd.year;
            }
            
            const allInstances = await Song.findAll({ where: whereClause });
            
            const uniquePlaylists = new Set(allInstances.map(s => s.playlistId));
            const newCount = uniquePlaylists.size;
            
            await Song.update(
              { playlistCount: newCount },
              { where: whereClause }
            );
          } catch (err) {
            console.error('Error updating playlist count for song', err.message);
          }
        }
      }
      return playlist;
      
    } catch (err) {
      console.error("Could not update playlist:", err.message);
      throw err;
    }
  }

  async getSongsByPlaylist(playlistId) {
    try {
      return await Song.findAll({
        where: { playlistId: playlistId }
      });
    } catch (err) {
      console.error("Could not get songs by playlist:", err.message);
      throw err;
    }
  }

  async getAllSongs() {
    try {
      const allSongs = await Song.findAll({
        include: [{
          model: Playlist,
          attributes: ['name', 'ownerEmail']
        }]
      });
      
      const uniqueSongsMap = new Map();
      for (const song of allSongs) {
        // Use YouTube ID as primary key
        const key = song.youTubeId || `${song.title}-${song.artist}-${song.year || ''}`;
        if (!uniqueSongsMap.has(key)) {
          const allInstancesOfThisSong = allSongs.filter(s => 
            s.youTubeId === song.youTubeId || (
              !s.youTubeId && !song.youTubeId && 
              s.title === song.title && 
              s.artist === song.artist && 
              s.year === song.year
            )
          );
          const uniquePlaylists = new Set(allInstancesOfThisSong.map(s => s.playlistId));
          const totalListens = allInstancesOfThisSong.reduce((sum, s) => sum + (s.listens || 0), 0);
          
          uniqueSongsMap.set(key, {
            title: song.title,
            artist: song.artist,
            year: song.year,
            youTubeId: song.youTubeId,
            ownerEmail: song.ownerEmail,
            playlistCount: uniquePlaylists.size,
            listens: totalListens
          });
        }
      }
      
      return Array.from(uniqueSongsMap.values());
    } catch (err) {
      console.error("Could not get all songs:", err.message);
      throw err;
    }
  }

  async filterSongCatalog(filters) {
    try {
      const { title, artist, year } = filters
      const songs = await this.getAllSongs();
      return songs.filter((song) => 
          (title ? song.title.toLowerCase().startsWith(title.toLowerCase().trim()) : true) &&
          (artist ? song.artist.toLowerCase().startsWith(artist.toLowerCase().trim()) : true) &&
          (year ? parseInt(song.year) === parseInt(year) : true)
      );

    } catch (err) {
      console.error('Could not filter Song Catalog:', err.message);
      throw err;
    }
  }

  async getAllPlaylists() {
    try {
      const playlists = await Playlist.findAll({
        include: [{
          model: Song,
          as: 'songs'
        }]
      });
      playlists.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      return playlists;
    } catch (err) {
      console.error('Could not get all playlists:', err.message);
      throw err;
    }
  }

    async incrementSongListen(playlistId, youTubeId, title, artist, year) {
      try {
        let whereClause = {};
        if (youTubeId) {
          whereClause.youTubeId = youTubeId;
        } else if (title && artist) {
          whereClause.title = title;
          whereClause.artist = artist;
          if (year !== undefined) whereClause.year = year;
        } else {
          throw new Error('Insufficient data to identify song');
        }
        
        const songs = await Song.findAll({ where: whereClause });
        if (!songs || songs.length === 0) {
          throw new Error('Could not find songs to update');
        }
        const maxListens = Math.max(...songs.map(s => s.listens || 0));
        const newListens = maxListens + 1;
        
        for (const s of songs) {
          s.listens = newListens;
          await s.save();
        }
        
        return songs[0];
      } catch (err) {
        console.error('Could not increment listens for song:', err.message);
        throw err;
      }
    }

    async incrementSongPlaylistCount(youTubeId, title, artist, year) {
      try {
        let whereClause = {};
        if (youTubeId) {
          whereClause.youTubeId = youTubeId;
        } else if (title && artist) {
          whereClause.title = title;
          whereClause.artist = artist;
          if (year !== undefined) whereClause.year = year;
        } else {
          throw new Error('Insufficient data to identify song');
        }
        const songs = await Song.findAll({ where: whereClause });
        if (!songs || songs.length === 0) {
          throw new Error('Could not find songs to update');
        }
        
        // Find the current maximum playlistCount across all instances
        const maxCount = Math.max(...songs.map(s => s.playlistCount || 0));
        const newCount = maxCount + 1;
        
        // Set all songs to the new count
        for (const s of songs) {
          const oldCount = s.playlistCount || 0;
          s.playlistCount = newCount;
          await s.save();
        }
        return songs[0];
      } catch (err) {
        console.error('Could not increment playlistCount for song:', err.message);
        throw err;
      }
    }

    async decrementSongPlaylistCount(youTubeId, title, artist, year) {
      try {
        let whereClause = {};
        if (youTubeId) {
          whereClause.youTubeId = youTubeId;
        } else if (title && artist) {
          whereClause.title = title;
          whereClause.artist = artist;
          if (year !== undefined) whereClause.year = year;
        } else {
          throw new Error('Insufficient data to identify song');
        }
        const songs = await Song.findAll({ where: whereClause });
        if (!songs || songs.length === 0) {
          throw new Error('Could not find songs to update');
        }
        for (const s of songs) {
          s.playlistCount = Math.max(0, (s.playlistCount || 1) - 1);
          await s.save();
        }
        return songs[0];
      } catch (err) {
        console.error('Could not decrement playlistCount for song:', err.message);
        throw err;
      }
    }

    async deleteSong(youTubeId, title, artist, year) {
      try {
        let whereClause = {};
        if (youTubeId) {
          whereClause.youTubeId = youTubeId;
        } else if (title && artist) {
          whereClause.title = title;
          whereClause.artist = artist;
          if (year !== undefined) whereClause.year = year;
        } else {
          throw new Error('Insufficient data to identify song');
        }
        
        const deletedCount = await Song.destroy({ where: whereClause });
        
        if (deletedCount === 0) {
          throw new Error('No songs found to delete');
        }
        
        return { success: true, deletedCount };
      } catch (err) {
        console.error('Could not delete song from catalog:', err.message);
        throw err;
      }
    }
  }
module.exports = PostgresManager;