import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import cloudStorage from './cloudStorage.mjs';
import sendEmailConfirmation from './mailgunEmail.mjs';
dotenv.config();
const bucketName = process.env.bucketName;

let isFileEmpty;

const downloadRepo = async (repoUrl, destination) => {
    try {
        const zipUrl = repoUrl;
        const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
        // Check if the response contains a valid zip file
        const contentType = response.headers['content-type'];
        if (contentType !== 'application/zip') {
            throw new Error('Invalid content type. Expected application/zip.');
        }

        // Check if the file is empty (0 bytes)
        if (response.data.byteLength === 0) {
            isFileEmpty = true;
            throw new Error('Downloaded file is empty.');
        }

        const zipFilePath = path.join('/tmp', `${destination}.zip`);
        fs.writeFileSync(zipFilePath, Buffer.from(response.data));

        console.log('Repository cloned and zipped successfully.');
    } catch (error) {
        console.error('Error downloading repository:', error.message);
        throw error;
    }
};

export const handler = async (event) => {
    let submittedUserEmail, submissionURL, signedUrl, assignmentName, gcpPath, status, message;
    try {
        const snsMessage = JSON.parse(event.Records[0].Sns.Message);
        submittedUserEmail = snsMessage.email;
        assignmentName = snsMessage.assignmentName;
        submissionURL = snsMessage.submissionUrl;
        const submissionCount = snsMessage.submissionCount;
        const submittedAssignmentID = snsMessage.assignmentId;
        status = snsMessage.status;
        message = snsMessage.message;
        const assignment_creator = snsMessage.accountId;
        const submissionId = snsMessage.submission_id

        await downloadRepo(submissionURL, submittedAssignmentID);

        const submittedBucketName = `${assignmentName}/${submittedUserEmail}/SubmissionAttempt-${submissionCount}`;
        gcpPath = bucketName + '/' + submittedBucketName

        signedUrl = await cloudStorage(`/tmp/${submittedAssignmentID}.zip`, submittedBucketName);

        await sendEmailConfirmation(submittedUserEmail, submissionURL, true, signedUrl, assignmentName, gcpPath, status, message, assignment_creator, submissionId, isFileEmpty);
    }
    catch (error) {
        await sendEmailConfirmation(submittedUserEmail, submissionURL, false, signedUrl, assignmentName, gcpPath, status, message, assignment_creator, submissionId, isFileEmpty);
        console.error('Error:', error.message);
        return { statusCode: 500, body: 'Error processing SNS message.' };
    }
};