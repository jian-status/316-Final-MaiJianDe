class DatabaseManager {
  async connect(...args) {
    throw new Error('connect() must be implemented by subclass');
  }
  
  async dropTable(...args) {
    throw new Error('dropTable() must be implemented by subclass');
  }

  async fillTable(...args) {
    throw new Error('fillTable() must be implemented by subclass');
  }
  
  async resetDB(...args) {
    throw new Error('resetDB() must be implemented by subclass');
  }

  async createUser(userData) {
    throw new Error('createUser() must be implemented by subclass');
  }

  async getUser(userId) {
    throw new Error('getUser() must be implemented by subclass');
  }

  async getUserByEmail(email) {
    throw new Error('getUserByEmail() must be implemented by subclass');
  }

  async updateUser(userId, data) {
    throw new Error('updateUser() must be implemented by subclass');
  }

  async deleteUser(userId) {
    throw new Error('deleteUser() must be implemented by subclass');
  }

  async createPlaylist(data) {
    throw new Error('createPlaylist() must be implemented by subclass');
  }

  async getPlaylist(playlistId) {
    throw new Error('getPlaylist() must be implemented by subclass');
  }

  async getPlaylistsByOwner(ownerEmail) {
    throw new Error('getPlaylistsByOwner() must be implemented by subclass');
  }

  async getAllPlaylists() {
    throw new Error('getAllPlaylists() must be implemented by subclass');
  }

  async updatePlaylist(playlistId, data) {
    throw new Error('updatePlaylist() must be implemented by subclass');
  }

  async deletePlaylist(playlistId) {
    throw new Error('deletePlaylist() must be implemented by subclass');
  }
}

module.exports = DatabaseManager;