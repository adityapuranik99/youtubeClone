### Docker image can be used for instiantiating one or more containers
### Dockerfile is a blue print for creating a docker image
### Dockerfile is a text file that contains all the commands that are executed when creating a docker image
### Docker image is a blue print for creating a docker container
### Container is going to run our code inside it

# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN apt-get update && apt-get install -y ffmpeg
RUN npm install

# Copy app source inside the docker image
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Define the command to run your app using CMD (only one CMD is allowed)
CMD [ "npm", "start" ]


### We use docker to deploy to production environment, so why are we not using build/serve? 