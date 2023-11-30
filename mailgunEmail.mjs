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

const sendEmailConfirmation = async (userEmail, submissionUrl, assignmentStatus, assignmentPath, assignmentName, gcpPath) => {
    let textData;
    let htmlData;
    if(assignmentStatus)
    {
        textData = `Dear ${userEmail},\n\n` +
        `Your assignment has been submitted successfully. Please access your submission from the following link.\n` +
        `Assignment Path: ${assignmentPath}\n\n` +
        `If you encounter any issues or have questions, please contact us.\n\n` +
        `Best regards,\n` +
        `Admin Team`;
        htmlData = `<p>Dear ${userEmail},</p>` +
        `<p>Your assignment has been submitted successfully. Please access your submission from the following link.</p>` +
        `<p><strong>Assignment Name:</strong> ${assignmentName} </p>` +
        `<p><strong>Downloadble Link:</strong> <a href="${assignmentPath}">Link</a> </p>` +
        `<p><strong>Cloud Storage Path:</strong> ${gcpPath}</p>` +
        `<p>If you encounter any issues or have questions, please contact us.</p>` +
        `<p>Best regards,<br/>Admin Team</p>`
    }
    else if(isValidUrl(submissionUrl) && submissionUrl.endsWith('.zip')){
        textData = `Greetings ${userEmail},\n\n` +
        `We've noticed a problem with your recent assignment submission. The zip file at the provided submission URL was not reachable.\n` +
        `Could you please verify that the submission URL (ending in .zip) is correct and accessible? Once confirmed, kindly resubmit before the deadline.\n\n` +
        `Assignment Title: ${assignmentName} \n\n` +
        `Your Submission Link: ${submissionUrl}\n\n` +
        `Warm regards,\n` +
        `The Administration Team`;

        htmlData = `<p>Greetings ${userEmail},</p>` +
        `<p>We've noticed a problem with your recent assignment submission. The zip file at the provided submission URL was not reachable.</p>` +
        `<p>Could you please verify that the submission URL (ending in .zip) is correct and accessible? Once confirmed, kindly resubmit before the deadline.</p>` +
        `<p><strong>Assignment Title:</strong> ${assignmentName} </p>` +
        `<p><strong>Your Submission Link:</strong> ${submissionUrl} </p>` +
        `<p>For any queries or assistance, feel free to reach out to us.</p>` +
        `<p>Warm regards,<br/>The Administration Team</p>`

    }
    else{
        textData = `Hello ${userEmail},\n\n` +
        `We've encountered a problem with your recent assignment submission. The zip file at your provided URL couldn't be accessed.\n` +
        `Kindly check the link for any errors and resubmit your assignment promptly to meet the deadline.\n\n` +
        `Assignment Title: ${assignmentName} \n\n` +
        `Your Submission Link: ${submissionUrl}\n\n` +
        `Should you need any assistance or have questions, feel free to reach out.\n\n` +
        `Warm regards,\n` +
        `The Administrative Team`;

        htmlData = `<p>Hello ${userEmail},</p>` +
        `<p>We've encountered a problem with your recent assignment submission. The zip file at your provided URL couldn't be accessed.</p>` +
        `<p>Kindly check the link for any errors and resubmit your assignment promptly to meet the deadline.</p>` +
        `<p><strong>Assignment Title:</strong> ${assignmentName} </p>` +
        `<p><strong>Your Submission Link:</strong> ${submissionUrl} </p>` +
        `<p>Should you need any assistance or have questions, feel free to reach out to us.</p>` +
        `<p>Warm regards,<br/>The Administrative Team</p>`
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
                uniqueId: {S : uniqueId},
                emailId: { S : userEmail },
                assignmentName: { S: assignmentName},
                submissionURL: { S : submissionUrl },
                epochTime : {S: epochTime.toString()}
            }
        insertItemToDynamoDB(item);
    } catch (err) {
        console.log(err);
    }
}

export default sendEmailConfirmation;
