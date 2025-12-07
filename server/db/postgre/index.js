const { Sequelize, DataTypes, Model } = require('sequelize');
const DatabaseManager = require("../index.js");
const dotenv = require('dotenv');

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
  firstName: {
    type: DataTypes.STRING,
    field: 'FirstName',
    allowNull: false 
  },
  lastName: { 
    type: DataTypes.STRING,
    field: 'lastName',
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false,
    field: 'Email',
    unique: true
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
    type: DataTypes.STRING, 
    allowNull: false 
  },
  artist: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  year: { 
    type: DataTypes.INTEGER
  },
  youTubeId: { 
    type: DataTypes.STRING 
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
    defaultValue: 1
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
  modelName: 'Song',
});

class Playlist extends Model {}

Playlist.init({
  _id: {
    type: DataTypes.STRING, // Let primary id be a string for mongodb compatibility
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
      console.log('Connected to PostgreSQL DB');
      return sequelize;
    } catch (e) {
      console.error('Failed to connect to PostgreSQL DB', e.message);
      throw e;
    }
  }

  async dropTable(model, name) {
    try {
      await model.drop();
      console.log(`Cleared ${name}`);
    } catch (err) {
      console.log(`Could not clear ${name}:`, err.message);
    }
  }

  async fillTable(model, name, data) {
    try {
      await model.bulkCreate(data);
      console.log(`Filled ${name}`)
    } catch (err) {
      console.log(`Could not fill ${name}:`, err.message);
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
          }));
          await Song.bulkCreate(songs);
        }
      }
    } catch (err) {
      console.log("Could not fill Songs:", err.message);
    }
  }

  async resetDB() {
    const testData = require("../../test/data/example-db-data.json");

    console.log("Resetting the Postgre DB");

    await this.dropTable(Song, "Songs");
    await this.dropTable(Playlist, "Playlists");
    await this.dropTable(User, "Users");

    const sequelize = await this.connection;
    await sequelize.sync(); // Rebuild db tables
    console.log("Rebuilt Postgres Tables");

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
      return await Playlist.findByPk(playlistId, {
        include: [{
          model: Song,
          as: 'songs'
        }]
      });
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
        const newSongs = songs.map(songData => {
          let year = null;
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not create playlist: Year must be a valid integer.`);
            }
            year = parsedYear;
          }
          
          return {
            title: songData.title,
            artist: songData.artist,
            year: year,
            youTubeId: songData.youTubeId,
            playlistId: playlist._id
          };
        });
        
        await Song.bulkCreate(newSongs);
      }
      return playlist;

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
        await Song.destroy({ where: { playlistId: listId } });
        
        const newSongs = songs.map((songData) => {
          // Validate year field
          let year = null;
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not update playlist: Year must be a valid integer.`);
            }
            year = parsedYear;
          }
          
          return {
            title: songData.title,
            artist: songData.artist,
            year: year,
            youTubeId: songData.youTubeId,
            playlistId: listId
          };
        });
        
        await Song.bulkCreate(newSongs);
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
      return await Song.findAll({
        include: [{
          model: Playlist,
          attributes: ['name', 'ownerEmail']
        }]
      });
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
  }
module.exports = PostgresManager;