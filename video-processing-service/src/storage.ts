// 1. GCS file interactions
// 2. Local file interactions

// Like a storage layer

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { stringify } from 'querystring';
import exp from 'constants';
import { resolve } from 'path';

const storage = new Storage();

const rawVideoBucketName = 'vps1-raw-videos';
const processedVideoBucketName = 'vps1-processed-files';

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/** 
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}
 * @returns A promise that resolves when the video has been converted
 */
export function convertVideo(rawVideoName:string, processedVideoName: string){
    // helps us resolve or reject the promise
    return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        // we are processing the video with the following options:
        .outputOptions("-vf", "scale=-1:360")
        // what to do when the processing is done
        .on("end", () => {
            console.log("Video processed successfully");
            // inherently resolve needs to resolve with a value
            // but that's not needed here, so we will return a void
            resolve();
        })
        // what to do if an error occurs
        .on("error", (err) => {
            console.log(`An error occured, ${err.message}`);
            reject(err);
        })
        // save the processed video to the output file path
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}

// processing part completed - we need to deal with the local FS now

/**
 * @param fileName - The name of the file to download from the
 * {@link rawVideoBucketName} bucket into the the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded
 */
export async function downloadRawVideo(fileName: string){
    // await function blocks any code after the line from running until 
    // the line execution is complete
    // We cannot call await without having an async function

    // async function has to return a promise

    await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({destination: `${localRawVideoPath}/${fileName}`});

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    )
}


/**
 * @param filename - The name of the file to be uploaded from the 
 * {@link localProcessedVideoPath} folder to the {@link processedVideoBucketName} bucket.
 * @returns A promise that resolves when the file has been successfully uploaded.
 */
export async function uploadProcessedVideo(fileName:string) {
    const bucket = storage.bucket(processedVideoBucketName);
    
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination:fileName
    })

    console.log(
        `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
    )

    await bucket.file(fileName).makePublic();
}


/**
 * @param fileName - The name of the file to delete from 
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the video is deleted.
 */
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}


/**
 * @param fileName - The name of the file to delete from 
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the video is deleted.
 */
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}


/**
 * @param filePath - The local file path of the file to be deleted.
 * @returns - A promise that resolves when the video has been deleted.
 */
function deleteFile(filePath:string): Promise<void>{
    return new Promise((resolve, reject) => {
        if(fs.existsSync(filePath)) {
            // unlink marks the file as deleted without actually clearing the disk
            fs.unlink(filePath, (err) => {
                if(err){
                    console.log(`Failed to delete the file at ${filePath}`, err);
                    reject(err);
                }
                else{
                    console.log(`File successfully deleted at ${filePath}`);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete `);
            resolve();
        }
    });
}


/**
 * Ensure a directory exists, if it necessary.
 * @param {string} dirPath - The directory path to check
 */
function ensureDirectoryExistence(dirPath: string){
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true}); // recurvise: tru enables created nested directories if needed
        console.log(`Directory created at ${dirPath}`);
    }
}