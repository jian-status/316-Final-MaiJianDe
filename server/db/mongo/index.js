const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DatabaseManager = require("../index.js");

dotenv.config();

const UserSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        passwordHash: { type: String, required: true },
        playlists: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]
    },
    { timestamps: true },
);

const User = mongoose.model('User', UserSchema);

// Playlist Schema and Model
const playlistSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        ownerEmail: { type: String, required: true },
        songs: { type: [{
            title: String,
            artist: String,
            year: Number,
            youTubeId: String
        }], required: true }
    },
    { timestamps: true },
);

const Playlist = mongoose.model('Playlist', playlistSchema);

class MongoDBManager extends DatabaseManager {
  
  constructor() {
    super();
    this.connection = this.connect();
  }

  async connect() {
    try {
      mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
      console.log('Connected to MongoDB DB');
      return mongoose.connection;
    } catch (e) {
      console.error('Failed to connect to MongoDB DB', e.message);
      throw e;
    }
  }

  async dropTable(collection, collectionName) {
    try {
      await collection.deleteMany({});
      console.log(collectionName + " cleared");
    } catch (err) {
      console.log(err);
    }
  }

  async fillTable(collection, collectionName, data) {
    for (let i = 0; i < data.length; i++) {
      let doc = new collection(data[i]);
      await doc.save();
    }
    console.log(collectionName + " filled");
  }

  async resetDB() {
    const testData = require("../../test/data/example-db-data.json");

    console.log("Resetting the Mongo DB");
    
    await this.dropTable(Playlist, "Playlist");
    await this.dropTable(User, "User");
    await this.fillTable(Playlist, "Playlist", testData.playlists);
    await this.fillTable(User, "User", testData.users);
  }

  async createUser(userData) {
    try {
      const newUser = new User(userData);
      return await newUser.save();
    } catch (err) {
      console.error("Could not create user:", err.message);
      throw err;
    }
  }

  async createPlaylist(data) {
    // Use the Playlist model defined in this file
    try {
      // Validate songs if they exist
      if (data.songs && data.songs.length > 0) {
        data.songs.forEach((songData) => {
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not create playlist: Year must be a valid integer.`);
            }
            songData.year = parsedYear;
          } else {
            songData.year = null;
          }
        });
      }
      
      const newPlaylist = new Playlist(data);
      return await newPlaylist.save();
    } catch (err) {
      console.error("Could not create playlist:", err.message);
      throw err;
    }
  }
  async getUser(userId) {
    try {
      return await User.findOne({ _id: userId });
    } catch (err) {
      console.error("Could not get user:", err.message);
      throw err;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ email: email });
    } catch (err) {
      console.error("Could not get user by email:", err.message);
      throw err;
    }
  }
  async getPlaylist(playlistId) {
    try {
      return await Playlist.findOne({ _id: playlistId });
    } catch (err) {
      console.error("Error getting playlist:", err.message);
      throw err;
    }
  }

  async getPlaylistsByOwner(ownerEmail) {
    try {
      const playlists = await Playlist.find({ ownerEmail: ownerEmail });
      playlists.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      return playlists;
    } catch (err) {
      console.error("Could not get playlists by owner:", err.message);
      throw err;
    }
  }

  async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(userId, updateData, { new: true });
    } catch (err) {
      console.error("Could not update user:", err.message);
      throw err;
    }
  }

  async updatePlaylist(playlistId, updateData) {
    try {
      if (updateData.songs && updateData.songs.length > 0) {
        updateData.songs.forEach((songData, index) => {
          if (songData.year !== undefined && songData.year !== null && songData.year !== '') {
            const parsedYear = parseInt(songData.year);
            if (isNaN(parsedYear)) {
              throw new Error(`Could not update playlist: Year must be a valid integer.`);
            }
            songData.year = parsedYear;
          } else {
            songData.year = null;
          }
        });
      }
      
      return await Playlist.findByIdAndUpdate(playlistId, updateData, { new: true });
    } catch (err) {
      console.error("Could not update playlist:", err.message);
      throw err;
    }
  }
  async deleteUser(userId) {
    try {
      return await User.findByIdAndDelete(userId);
    } catch (err) {
      console.error("Could not delete user:", err.message);
      throw err;
    }
  }

  async deletePlaylist(playlistId) {
    try {
      return await Playlist.findByIdAndDelete(playlistId);
    } catch (err) {
      console.error("Could not delete playlist:", err.message);
      throw err;
    }
  }
}

module.exports = MongoDBManager;