import express from "express";
import ffmpeg from 'fluent-ffmpeg';


const app = express();
app.use(express.json());
// const port = 3000;

app.post("/process-video", (req,res) => {
    // Get path of the input video file from the request body
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath){
        res.status(400).send("Bad Request: Missing file path.")
    }

    ffmpeg(inputFilePath)
        // we are processing the video with the following options:
        .outputOptions("-vf", "scale=-1:360")
        // what to do when the processing is done
        .on("end", () => {
            res.status(200).send("Video processed successfully");
        })
        // what to do if an error occurs
        .on("error", (err) => {
            console.log(`An error occured, ${err.message}`);
            res.status(500).send(`Internal Server Error: ${err.message}`);
        })
        // save the processed video to the output file path
        .save(outputFilePath);

        
});


// Declare the port through either env variable or default to 3000
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`)
});