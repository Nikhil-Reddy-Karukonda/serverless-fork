import dotenv from 'dotenv';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { v4 as uuidv4 } from 'uuid';
import insertItemToDynamoDB from './mailTracker.mjs';
dotenv.config();

const mailgun = new Mailgun(formData);

const domain = process.env.domainName;
const apiKey = process.env.MAILGUN_API_KEY;
const mg = mailgun.client({ username: 'api', key: apiKey });

const isValidUrl = (url) => {
    // Regular expression for a valid URL
    const urlPattern = new RegExp('^(https?|ftp):\\/\\/[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?$');
    return urlPattern.test(url);
};

const sendEmailConfirmation = async (userEmail, submissionUrl, assignmentStatus, assignmentPath, assignmentName, gcpPath, status, message, assignment_creator, submissionId, isFileEmpty) => {
    let textData;
    let htmlData;

    if (status === "SUCCESS") {
        textData = `Dear ${userEmail},\n\n` +
            `Your assignment has been submitted successfully. Please access your submission from the following link.\n` +
            `Assignment Name: ${assignmentName} \n` +
            `Assignment Path: ${assignmentPath}\n\n` +
            `Cloud Storage Path: ${gcpPath}\n\n` +
            `Submission URL: ${submissionUrl}\n\n` +
            `Submission ID: ${submissionId}\n\n` +
            `If you encounter any issues or have questions, please contact us.\n\n` +
            `Best regards,\n` +
            `Admin Team`;
        htmlData = `<p>Dear ${userEmail},</p>` +
            `<p>Your assignment has been submitted successfully. Please access your submission from the following link.</p>` +
            `<p><strong>Assignment Name:</strong> ${assignmentName}</p>` +
            `<p><strong>Downloadable Link:</strong> <a href="${assignmentPath}">Link</a></p>` +
            `<p><strong>Cloud Storage Path:</strong> ${gcpPath}</p>` +
            `<p><strong>Submission URL:</strong> <a href="${submissionUrl}">${submissionUrl}</a></p>` +
            `<p><strong>Submission ID:</strong> ${submissionId}</p>` +
            `<p>If you encounter any issues or have questions, please contact us.</p>` +
            `<p>Best regards,<br/>Admin Team</p>`;
    }
    else if (!isValidUrl(submissionUrl) || !submissionUrl.endsWith('.zip')) {
        textData = `Greetings ${userEmail},\n\n` +
            `We've noticed a problem with your recent assignment submission. The zip file at the provided submission URL was not reachable.\n` +
            `Could you please verify that the submission URL (ending in .zip) is correct and accessible? Once confirmed, kindly resubmit before the deadline.\n\n` +
            `Assignment Title: ${assignmentName}\n\n` +
            `Your Submission Link: ${submissionUrl}\n\n` +
            `Warm regards,\n` +
            `The Administration Team`;

        htmlData = `<p>Greetings ${userEmail},</p>` +
            `<p>We've noticed a problem with your recent assignment submission. The zip file at the provided submission URL was not reachable.</p>` +
            `<p>Could you please verify that the submission URL (ending in .zip) is correct and accessible? Once confirmed, kindly resubmit before the deadline.</p>` +
            `<p><strong>Assignment Title:</strong> ${assignmentName}</p>` +
            `<p><strong>Your Submission Link:</strong> <a href="${submissionUrl}">${submissionUrl}</a></p>` +
            `<p>For any queries or assistance, feel free to reach out to us.</p>` +
            `<p>Warm regards,<br/>The Administration Team</p>`;
    }
    else if (status === 'DEADLINE_PASSED') {
        textData = `Hello ${userEmail},\n\n` +
            `We regret to inform you that the deadline for the assignment submission has passed. Unfortunately, we cannot accept your submission at this time.\n\n` +
            `Assignment Title: ${assignmentName}\n\n` +
            `Please be mindful of future deadlines to ensure your submissions are accepted.\n\n` +
            `If you have any questions or need assistance, feel free to reach out to us.\n\n` +
            `Warm regards,\n` +
            `The Administrative Team`;

        htmlData = `<p>Hello ${userEmail},</p>` +
            `<p>We regret to inform you that the deadline for the assignment submission has passed. Unfortunately, we cannot accept your submission at this time.</p>` +
            `<p><strong>Assignment Title:</strong> ${assignmentName}</p>` +
            `<p>Please be mindful of future deadlines to ensure your submissions are accepted.</p>` +
            `<p>If you have any questions or need assistance, feel free to reach out to us.</p>` +
            `<p>Warm regards,<br/>The Administrative Team</p>`;
    }
    else if (status === 'MAX_ATTEMPTS') {
        textData = `Dear ${userEmail},\n\n` +
            `Unfortunately, your recent assignment submission could not be processed as you have reached the maximum number of allowed attempts.\n` +
            `Assignment Title: ${assignmentName}\n\n` +
            `Please review the assignment guidelines and contact us if you require further assistance.\n\n` +
            `Best regards,\n` +
            `Admin Team`;

        htmlData = `<p>Dear ${userEmail},</p>` +
            `<p>Unfortunately, your recent assignment submission could not be processed as you have reached the maximum number of allowed attempts.</p>` +
            `<p><strong>Assignment Title:</strong> ${assignmentName}</p>` +
            `<p>Please review the assignment guidelines and contact us if you require further assistance.</p>` +
            `<p>Best regards,<br/>Admin Team</p>`;
    }
    else if (isFileEmpty) {
        textData = `Greetings ${userEmail},\n\n` +
            `Your recent assignment submission could not be accepted as the file submitted does not contain any content.\n` +
            `Please ensure that you are submitting a valid, non-empty zip file and try again.\n\n` +
            `Assignment Title: ${assignmentName}\n\n` +
            `Your Submission Link: ${submissionUrl}\n\n` +
            `Warm regards,\n` +
            `The Administration Team`;

        htmlData = `<p>Greetings ${userEmail},</p>` +
            `<p>Your recent assignment submission could not be accepted as the file submitted does not contain any content.</p>` +
            `<p>Please ensure that you are submitting a valid, non-empty zip file and try again.</p>` +
            `<p><strong>Assignment Title:</strong> ${assignmentName}</p>` +
            `<p><strong>Your Submission Link:</strong> <a href="${submissionUrl}">${submissionUrl}</a></p>` +
            `<p>Warm regards,<br/>The Administration Team</p>`;
    }
    else {
        textData = `Dear ${userEmail},\n\n` +
            `We encountered an issue with your assignment submission. Please ensure that your submission complies with the guidelines and resubmit.\n` +
            `Assignment Title: ${assignmentName}\n\n` +
            `For any queries or assistance, please feel free to contact us.\n\n` +
            `Best regards,\n` +
            `Admin Team`;

        htmlData = `<p>Dear ${userEmail},</p>` +
            `<p>We encountered an issue with your assignment submission. Please ensure that your submission complies with the guidelines and resubmit.</p>` +
            `<p><strong>Assignment Title:</strong> ${assignmentName}</p>` +
            `<p>For any queries or assistance, please feel free to contact us.</p>` +
            `<p>Best regards,<br/>Admin Team</p>`;
    }
    const mailData = {
        from: 'Admin <Admin@' + domain + '>',
        to: [userEmail],
        cc: [process.env.emailCC],
        subject: `Assignment submission status`,
        text: textData,
        html: htmlData
    };

    try {
        const msg = await mg.messages.create(domain, mailData);
        console.log(msg);
        const epochTime = Date.now();
        const uniqueId = uuidv4();
        const item =
        {
            uniqueId: { S: uniqueId },
            emailId: { S: userEmail },
            assignmentName: { S: assignmentName },
            submissionURL: { S: submissionUrl },
            epochTime: { S: epochTime.toString() }
        }
        insertItemToDynamoDB(item);
    } catch (err) {
        console.log(err);
    }
}

export default sendEmailConfirmation;