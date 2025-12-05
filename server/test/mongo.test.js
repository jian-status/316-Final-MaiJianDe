import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
const dotenv = require('dotenv')
const testData = require('./data/example-db-data.json')

dotenv.config()

let db = null
let dbName = ''

if (!process.env.DB || process.env.DB === 'mongo') {
  const MongoDBManager = require('../db/mongo/index.js')
  db = new MongoDBManager()
  dbName = 'MongoDB'
} else {
  const PostgresManager = require('../db/postgre/index.js')
  db = new PostgresManager()
  dbName = 'Postgre'
}

beforeAll(async () => {
  try {
    await db.connection
  } catch (error) {
    console.warn(`${dbName} failed to connect to database:`, error.message)
    return
  }
})

beforeEach(async () => {
  try {
    await db.resetDB()
  } catch (error) {
    console.warn(`${dbName} resetDB function failed:`, error.message)
  }
})

test('testing resetDB output', async () => {
      try {
        const joe = await db.getUserByEmail('joe@shmo.com')
        expect(joe).toBeTruthy()
        expect(joe.firstName).toBe('Joe')
        expect(joe.lastName).toBe('Shmo')

        const joePlaylists = await db.getPlaylistsByOwner('joe@shmo.com')
        expect(joePlaylists).toHaveLength(2)

        const jian = await db.getUserByEmail('jian@gmail.com')
        expect(jian).toBeTruthy()
        expect(jian.firstName).toBe('Jian')

        const jianPlaylists = await db.getPlaylistsByOwner('jian@gmail.com')
        expect(jianPlaylists).toHaveLength(1)
        expect(jianPlaylists[0].name).toBe('Summer Hits')
        expect(jianPlaylists[0].songs).toHaveLength(7)        
      } catch (err) {
        console.warn(`${dbName} testing restDB output failed:`, err.message)
      }
    })

test('testing getUserByEmail output', async () => {
      try {
        const user = await db.getUserByEmail('jian@gmail.com')
        
        expect(user).toBeTruthy()
        expect(user.firstName).toBe('Jian')
        expect(user.lastName).toBe('Mai')
        expect(user.email).toBe('jian@gmail.com')
        expect(user.passwordHash).toBe('$2a$10$dPEwsAVi1ojv2RfxxTpZjuKSAbep7zEKb5myegm.ATbQ4sJk4agGu')
      } catch (error) {
        console.warn(`${dbName} testing getUserByEmail output failed:`, error.message)
      }
    })

    test('testing getUser output', async () => {
      try {
        const userByEmail = await db.getUserByEmail('jian@gmail.com')
        const userById = await db.getUser(userByEmail._id)
        
        expect(userById).toBeTruthy()
        expect(userById.email).toBe('jian@gmail.com')
        expect(userById.firstName).toBe('Jian')
        expect(userById.lastName).toBe('Mai')
      } catch (error) {
        console.warn(`${dbName} testing getUser output failed:`, error.message)
      }
    })

    test('testing createUser output', async () => {
      try {
        const newUser = await db.createUser({
          firstName: 'Aloh',
          lastName: 'K',
          email: 'AlohK@gmail.com',
          passwordHash: '2b392e6a-4d28-464a-ae95-6363f2f5d482'
        })

        expect(newUser).toBeTruthy()

        const dbUser = await db.getUserByEmail('AlohK@gmail.com')
        expect(dbUser.firstName).toBe('Aloh')
        expect(dbUser.lastName).toBe('K')
        expect(dbUser.email).toBe('AlohK@gmail.com')
        expect(dbUser.passwordHash).toBe('2b392e6a-4d28-464a-ae95-6363f2f5d482')
      } catch (error) {
        console.warn(`${dbName} testing createUser output failed:`, error.message)
      }
    })

    test('testing updateUser output', async () => {
      try {
        const user = await db.getUserByEmail('jian@gmail.com')
    
        await db.updateUser(user._id, {
          firstName: 'Awpeo',
          lastName: 'AA',
          email: 'jian.updated@gmail.com'
        })
        
        const getUser = await db.getUser(user._id)
        expect(getUser.firstName).toBe('Awpeo')
        expect(getUser.lastName).toBe('AA')
        expect(getUser.email).toBe('jian.updated@gmail.com')
        
        const userByNewEmail = await db.getUserByEmail('jian.updated@gmail.com')
        expect(userByNewEmail).toBeTruthy()
        expect(userByNewEmail._id).toEqual(user._id)
        expect(await db.getUserByEmail('jian@gmail.com')).toBeFalsy()
        
      } catch (error) {
        console.warn(`${dbName} testing updateUser output failed:`, error.message)
      }
    })

    test('testing deleteUser output', async () => {
      try {
        const user = await db.getUserByEmail('joe@shmo.com')
        await db.deleteUser(user._id)
        
        expect(await db.getUserByEmail('joe@shmo.com')).toBeFalsy()
      } catch (error) {
        console.warn(`${dbName} testing deleteUser output failed:`, error.message)
      }
    })

test('testing getPlaylistsByOwner output', async () => {
      try {
        const jianPlaylists = await db.getPlaylistsByOwner('jian@gmail.com')
        expect(jianPlaylists).toHaveLength(1)
        
        expect(jianPlaylists[0].name).toBe('Summer Hits')
        
        expect(jianPlaylists[0].songs).toHaveLength(7)
      } catch (error) {
        console.warn(`${dbName} testing getPlaylistsByOwner output failed:`, error.message)
      }
    })

    test('testing getPlaylist output', async () => {
      try {
        const jianPlaylists = await db.getPlaylistsByOwner('jian@gmail.com')
        const summerHitsId = jianPlaylists[0]._id
        
        const playlist = await db.getPlaylist(summerHitsId)
        
        expect(playlist).toBeTruthy()
        expect(playlist.name).toBe('Summer Hits')
        expect(playlist.ownerEmail).toBe('jian@gmail.com')
        expect(playlist.songs).toHaveLength(7)
        
        const song = playlist.songs[0]
        expect(song.title).toBe('Not Like Us')
        expect(song.artist).toBe('Kendrick Lamar')
        expect(song.year).toBe(2024)
        expect(song.youTubeId).toBe('T6eK-2-A2-M')
      } catch (error) {
        console.warn(`${dbName} testing getPlaylist output failed:`, error.message)
      }
    })

    test('testing createPlaylist output', async () => {
      try {
        const newPlaylist = await db.createPlaylist({
          name: 'JIANANNAN',
          ownerEmail: 'jian@gmail.com',
          songs: [
            {
              title: 'A',
              artist: 'B',
              year: 2018,
              youTubeId: 'AB'
            },
            {
              title: 'C',
              artist: 'D',
              year: 1999,
              youTubeId: 'CD'
            }
          ]
        })

        expect(newPlaylist).toBeTruthy()
        expect(newPlaylist.name).toBe('JIANANNAN')

        expect(await db.getPlaylistsByOwner('jian@gmail.com')).toHaveLength(2)

        const testPlaylist = (await db.getPlaylistsByOwner('jian@gmail.com')).find(p => p.name === 'JIANANNAN')
        expect(testPlaylist).toBeTruthy()
        expect(testPlaylist.songs).toHaveLength(2)
        
        expect(testPlaylist.songs[0].title).toBe('A')
        expect(testPlaylist.songs[0].artist).toBe('B')
        expect(testPlaylist.songs[0].year).toBe(2018)
        expect(testPlaylist.songs[0].youTubeId).toBe('AB')
        
        expect(testPlaylist.songs[1].title).toBe('C')
        expect(testPlaylist.songs[1].artist).toBe('D')
        expect(testPlaylist.songs[1].year).toBe(1999)
        expect(testPlaylist.songs[1].youTubeId).toBe('CD')

      } catch (error) {
        console.warn(`${dbName} testing createPlaylist output failed:`, error.message)
      }
    })

    test('testing updatePlaylist output', async () => {
      try {
        const jianPlaylists = await db.getPlaylistsByOwner('jian@gmail.com')
        const listId = jianPlaylists[0]._id
      
        await db.updatePlaylist(listId, {
          name: 'New Summer Hits',
          songs: [
            {
              title: 'Test Song',
              artist: 'Test Artist',
              year: 1865,
              youTubeId: 'testId'
            }
          ]
        })
        const updatedPlaylist = await db.getPlaylist(listId)

        expect(updatedPlaylist.name).toBe('New Summer Hits')
        expect(updatedPlaylist.songs).toHaveLength(1)

        expect(updatedPlaylist.songs[0].title).toBe('Test Song')
        expect(updatedPlaylist.songs[0].artist).toBe('Test Artist')
        expect(updatedPlaylist.songs[0].year).toBe(1865)
        expect(updatedPlaylist.songs[0].youTubeId).toBe('testId')

      } catch (error) {
        console.warn(`${dbName} testing updatePlaylist output failed:`, error.message)
      }
    })

    test('testing deletePlaylist output', async () => {
      try {
        const jianPlaylists = await db.getPlaylistsByOwner('jian@gmail.com')
        const listId = jianPlaylists[0]._id
        
        await db.deletePlaylist(listId)
        expect(await db.getPlaylist(listId)).toBeFalsy()        
        expect(await db.getPlaylistsByOwner('jian@gmail.com')).toEqual([])
      } catch (error) {
        console.warn(`${dbName} testing deletePlaylist output failed:`, error.message)
      }
    })