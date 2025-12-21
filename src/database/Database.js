import pkg from 'pg';
const { Client, Pool } = pkg;
import logger from '../utils/logger.js'
import * as dotenv from "dotenv";
import DatabaseError from '../error/DatabaseError.js';
import fs from 'fs/promises';
import { join } from 'path';
dotenv.config();

/**
 * Class representing the database connection and operations.
 * HubOS uses PostgreSQL as its database system.
 */
class Database {

    /**
     * Constructor of the Database class.
     */
    constructor() { // default context value if not provided
        this.client = new Client({
            host: process.env.POSTGRES_HOST,
            user: process.env.POSTGRES_USER,
            database: process.env.POSTGRES_DATABASE,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT
        });

        this.pool = new Pool({
            host: process.env.POSTGRES_HOST,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT,
            database: process.env.POSTGRES_DATABASE
        })
    }


    /**
     * Connect to the db and verify the hubos-db database exist
     */
    async setupDatabase(){
        this.client = new Client({
            host: process.env.POSTGRES_HOST,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT
        });
        await this.client.connect()
        logger.info("Database Connected !",true);
        const res = await this.client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.POSTGRES_DATABASE}'`);        
        if (res.rowCount === 0) {
            logger.info(`${process.env.POSTGRES_DATABASE} database not found, creating it.`,true);
            await this.client.query(`CREATE DATABASE "${process.env.POSTGRES_DATABASE}";`,true);
            logger.info(`created database ${process.env.POSTGRES_DATABASE}`,true);
        } else {
            logger.info(`${process.env.POSTGRES_DATABASE} database exists.`,true);
        }
        await this.client.end();
        this.client = new Client({
            host: process.env.POSTGRES_HOST,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT,
            database: process.env.POSTGRES_DATABASE
        });
    }

    /**
     * Create the necessary extension for the db 
     * HubOS uses the 'uuid-ossp' extension to generate UUIDs.
     */
    async setupExtension(){
        const client = await this.pool.connect();
        try{
            const query = ` 
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            `;
            await client.query(query);
            logger.info("extension 'uuid-ossp' created",true);
        } catch (err) {
            logger.error("Error while creating the extension: ",true, err);
        } finally{
            client.release();
        }
    }

    /**
     * Connect to the db.
     */
    async connect(){
        this.client.connect()
            .then(() => logger.info('Connected to the db',true))
            .catch(err => {
                throw new DatabaseError('Connection error: ',true, err);
            })
    }
    

    /**
     * Disconnect from the db.
     */
    async disconnect(){
        this.client.end();
    }

    /**
     * Initiate the db with the necessary tables.
     */
    async initDB(__datanaseDirPath){ 
        const sql = await fs.readFile(join(__datanaseDirPath,'./migrations/001_init.sql'), 'utf-8');
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');

            logger.info("Apps table created",true);
            logger.info("Modules table created",true);
            logger.info("app devices table created",true);
            logger.info("app servers table created",true);
            logger.info("Events table created",true);
            logger.info("Permissions table created",true);

        } catch (err) {
            await client.query('ROLLBACK');
            logger.error("Error while initiating the db: ",true, err);
        } finally{
            client.release();
        }
    }

    /**
     * Drop all table in the db
     */
    async dropTables(){
        const client = await this.pool.connect();
        try{
            const dropQuery = ` 
                DROP TABLE IF EXISTS permission;
                DROP TABLE IF EXISTS event;
                DROP TABLE IF EXISTS module;
                DROP TABLE IF EXISTS appDevice;
                DROP TABLE IF EXISTS appServer;
                DROP TABLE IF EXISTS app;
            `;
            await client.query(dropQuery);
            logger.info("ALL table are dropped",true);
        } catch (err) {
            logger.error("Error while removing table from the db: ",true, err);
        } finally{
            client.release();
        }
    }

    /**
     * Add a new event into the event table.
     * @param {String} moduleId - UID of the parrent module
     * @param {String} eventName - Name of the event
     * @returns The UID of the added line.
     */
    async insertEvent(moduleId, eventName){
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO event (module_id, name)
                VALUES ($1, $2)
                RETURNING id
            `;
            const { rows } = await client.query(query, [moduleId, eventName]);
        
            if (rows.length > 0) {
                logger.info(`new event inserted with id=${rows[0].id}`);
                return rows[0].id;
            } else {
                logger.warn(`No line inserted with eventName = ${eventName}`);
                return null;
            }
        } catch (err) {
        logger.error('Error while adding a new event : ',false, err);
        throw err; 
        } finally {
        client.release();
        }
    }

    /**
     * Add a new permission into the permission table.
     * @param {String} eventId - UID of the parrent event.
     * @param {String} permissionName - Name of the permission.
     * @returns The UID of the added line.
     */
    async insertPermission(eventId, permissionName){
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO permission (event_id, name)
                VALUES ($1, $2)
                RETURNING id
            `;
            const { rows } = await client.query(query, [eventId, permissionName]);
        
            if (rows.length > 0) {
                logger.info(`new permission inserted with id=${rows[0].id}`);
                return rows[0].id;
            } else {
                logger.warn(`No line inserted with permissionName = ${eventName}`);
                return null;
            }
        } catch (err) {
        logger.error('Error while adding a new permission : ',false, err);
        throw err; 
        } finally {
        client.release();
        }
    }

    /**
     * Gets the UID of an app by its name.
     * @param {App} app - The name of the app.
     * @returns The app UID if found, or null if not found.
     */
    async getAppByName(appName) {
        const client = await db.pool.connect();
        try {
            const queryText = `
            SELECT (id, name, path, type, description)
            FROM app
            WHERE name = $1
            LIMIT 1
            `;
            const { rows } = await client.query(queryText, [appName]);

            if (rows.length > 0) {
                return rows[0].id;
            } else {
                return null;
            }
        } catch (err) {
            console.error('Error retrieving app ID:',false, err);
            throw err;
        } finally {
            client.release();
        }
    }


}


const db = new Database();

export default db; // Singleton instance of the Database class