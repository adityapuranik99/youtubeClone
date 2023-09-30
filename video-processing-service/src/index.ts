import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

setupDirectories();


const app = express();
app.use(express.json());
// const port = 3000;

// For arrow function, we put async before the (req,res)
app.post("/process-video", async (req,res) => {
    // Get the bucket and filename from the Cloud Pub/Sub message
    // Cloud Pub/Sub is a message queue handled by the cloud. 
    // So whenever a new file is uploaded to the raw video bucket
    // the endpoint would be notified via the message queue.

    let data;
    try{
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if(!data.name){
            throw new Error('Invalid message payload received!');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename');
    }
    

    // We would need an indicator to check if the our processing code has run fine or not
    // For that we will need the function to return something like a promise

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw video from cloud storage
    await downloadRawVideo(inputFileName);    

    // Processing the video
    try{
        convertVideo(inputFileName, outputFileName);
    } catch (err) {

        // we are going to parallely await for both the promises to resolve
        // rather than putting them in serial way
        await Promise.all ([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ])
        
        console.log(err);
        return res.status(500).send('Internal Server Error: video processing tutorial');
    }

    // Upload the processed video from cloud storage;
    await uploadProcessedVideo(outputFileName);

    await Promise.all ([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ])
        
    return res.status(200).send('Processing finished successfully!');
});


// Declare the port through either env variable or default to 3000
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`)
});