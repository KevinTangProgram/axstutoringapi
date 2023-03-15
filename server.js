const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
connection = "mongodb+srv://KevinTang:0hmlsVIAJwbjWuTf@axs-tutoring.c24c5cd.mongodb.net/?retryWrites=true&w=majority";//2xvy-BTPm7zNyvj
const crypto = require('crypto-js');

const hash = crypto.SHA256("Hello").toString();
//console.log(hash);
/*
const sha256 = require.config({
    paths: {
      "crypto-js": "path-to/bower_components/crypto-js/crypto-js",
    },
  })
  */

/*
var smtpConfig = {
    host: 'mail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'axstutoring@mail.com',
        pass: 'B4y27*Zct,3.Nw/'
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
*/

/*
const transporter = nodemailer.createTransport( {
    service: "hotmail",
    auth: {
        user: "axstutoring@outlook.com",
        pass: "B4y27*Zct,3.Nw/"
    }
});
*/

const transporter = nodemailer.createTransport( {
    service: "Zoho",
    auth: {
        user: "axstutoring@zohomail.com",
        pass: "Rs5m4zTPmncNsxZ"
    }
});



mongoose.set('strictQuery', false);

mongoose
    .connect (connection, 
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => console.log("Connected to DB"))
        .catch(console.error);

const app = express();
app.use(express.json());
app.use(cors());

app.listen(8080, () => {console.log("Server listening on port 8080");})

const Request = require("./models/request");

const Course = require("./models/course");

const Post = require("./models/post");

const Email = require("./models/email");

const timeTable = ["8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM", 
"9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM", 
"10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM", 
"11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM", 
"12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM", 
"1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM", 
"2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM", 
"3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM", 
"4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM", 
"5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM", 
"6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM", 
"7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
];

const subjectDivision = ["Chemistry", "Biology", "Math", "Physics", "Comp Sci"];

function dateEncoder(bookDate)
{
    const weekList = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let dateProcessor = "{";
    let comparisonString = bookDate.substr(0, 3);
    for (let j = 0; j < 7; j++)
    {
        if (comparisonString === weekList[j])
        {
            dateProcessor += j.toString();
            break;
        }
    }

    comparisonString = bookDate.substr(19);
    for (let j = 0; j < 48; j++)
    {
        if (comparisonString === timeTable[j])
        {
            if (j < 10)
            {
                dateProcessor += "0";
            }
            dateProcessor += j.toString();
            break;
        }
    }

    dateProcessor += bookDate.substr(11, 4);

    comparisonString = bookDate.substr(4, 3);
    for (let j = 0; j < 12; j++)
    {
        if (comparisonString === monthList[j])
        {
            if (j < 9)
            {
                dateProcessor += "0";
            }
            dateProcessor += (j+1).toString();
            break;
        }
    }

    dateProcessor += bookDate.substr(8, 2) + "}";
    return dateProcessor;
}

app.get('/checkemail', async (req, res) => {
    const feed = await Email.find();
    let flag = 1;
    let username = "";
    if (req.query.email.includes("@g.ucla.edu"))
    {
        username = req.query.email.replace("@g.ucla.edu", "");
    }
    else if (req.query.email.includes("@ucla.edu"))
    {
        username = req.query.email.replace("@ucla.edu", "");
    }
    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].email === username && (feed[i].bookings.length === 0 || feed[i].bookings[0] != '-'))
        {
            let updatedString = "";
            let bookingsThisWeek = 0;
            //console.log(feed[i].bookings);
            const todayDate = new Date();
            for (let j = 0; j < feed[i].bookings.length; j+= 13)
            {
                //console.log("yes");
                let monthNumber = Number(feed[i].bookings.substring(j + 8, j + 10));
                //console.log(monthNumber);
                let dayNumber = Number(feed[i].bookings.substring(j + 10, j + 12));
                //console.log(dayNumber);
                let dayDifference = (todayDate.getMonth() + 1 - monthNumber)*30 + (todayDate.getDate() - dayNumber);
                //console.log(dayDifference);
                if (dayDifference < 21 && todayDate.getFullYear() === Number(feed[i].bookings.substring(j + 4, j + 8)))
                {
                    updatedString += feed[i].bookings.substring(j, j + 13);
                }
                if (dayDifference < 0 && todayDate.getFullYear() === Number(feed[i].bookings.substring(j + 4, j + 8)))
                {
                    bookingsThisWeek++;
                }
            }
            const id = feed[i]._id;
            const post = await Email.findByIdAndUpdate(id, {
                bookings: updatedString,
            }, { new: true });
            post.save();
            if (bookingsThisWeek < 2 && updatedString.length < 52)
            {
                flag = 0;
            }
            else if (updatedString.length >= 52)
            {
                flag = 2;
            }
            else if (bookingsThisWeek >= 2)
            {
                flag = 3;
            }
            break;
        }
    }
    res.json(flag);
})

app.get('/checkcode', async (req, res) => {
    const feed = await Email.find();

    flag = false;
    let username = "";
    if (req.query.email.includes("@g.ucla.edu"))
    {
        username = req.query.email.replace("@g.ucla.edu", "");
    }
    else if (req.query.email.includes("@ucla.edu"))
    {
        username = req.query.email.replace("@ucla.edu", "");
    }
    //console.log(username);
    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].email === username)
        {
            if (feed[i].bookings.substring(1, 7) === req.query.code)
            {
                flag = true;
                if (feed[i].bookings.length > 0 && feed[i].bookings[0] === '-')
                {
                    const id = feed[i]._id;
                    const post = await Email.findByIdAndUpdate(id, {
                        bookings: "",
                    }, { new: true });
                    post.save();
                }
            }
        }
    }

    res.json(flag);
})

app.post('/email/new', async (req, res) => {
    const feed = await Email.find();

    let code = "";

    for (let i = 0; i < 6; i++)
    {
        code += Math.floor(Math.random() * 10).toString();
    }
    let username = "";
    if (req.body.email.includes("@g.ucla.edu"))
    {
        username = req.body.email.replace("@g.ucla.edu", "");
    }
    else if (req.body.email.includes("@ucla.edu"))
    {
        username = req.body.email.replace("@ucla.edu", "");
    }
    //console.log(username);
    let flag = true;
    let sendEmail = false;

    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].email === username)
        {
            //console.log(Date.now());
            //console.log(Number(feed[i].bookings.substring(8)));
            //console.log((Date.now() - Number(feed[i].bookings.substring(8))));
            if (Date.now() - Number(feed[i].bookings.substring(8)) > 60000)
            {
                const id = feed[i]._id;
                const post = await Email.findByIdAndUpdate(id, {
                    bookings: "-" + code + "|" + Date.now().toString(),
                }, { new: true });
                post.save();
                sendEmail = true;
            }
            flag = false;
            break;
        }
    }
    //console.log(flag);
    if (flag)
    {
        const post = new Email({
            email: username,
            bookings: "-" + code + "|" + Date.now().toString(),
        });
        post.save();
        sendEmail = true;
    }

    //console.log(sendEmail);

    if (sendEmail)
    {
        const message = "Dear " + req.body.student + ",\n\n" + "Please enter " + code + " to validate your email.\n"
        + "\nSincerely,\nArthur Huang and Claire Luong";

        const options = {
            from: "axstutoring@zohomail.com",
            to: req.body.email,
            subject: "AXS Tutoring - Email Validation",
            text: message,
        };
        
        new Promise((resolve, reject) => {
            transporter.sendMail(options, function (err, info){
                if (err)
                {
                    reject(err);
                }
                else
                {
                    resolve("email sent");
                }
                //console.log("Sent", info.response);
            });
        })
    }
    res.json(0);
})

app.get('/courselist', async (req, res) => {
    const feed = await Course.find();

    let returnArray = new Array;

    function isNumber(str){
        return /^\d+$/.test(str);
    }

    let position = 0;
    for (; position < subjectDivision.length; position++)
    {
        if (subjectDivision[position] === req.query.series)
        {
            break;
        }
    }
    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].subjectDivision[position])
        {
            if (req.query.alternative !== "")
            {
                if (req.query.alternative === "Up")
                {
                    let count = 0;
                    for (let j = 0; j < feed[i].course.length; j++)
                    {
                        if (isNumber(feed[i].course[j]))
                        {
                            count++;
                        }
                    }
                    if (count === 3)
                    {
                        returnArray.push(feed[i].course);
                    }
                }
                else if (req.query.alternative === "Ot")
                {
                    if ((!feed[i].course.includes("14") && !feed[i].course.includes("20") && !feed[i].course.includes("30")))
                    {
                        let count = 0;
                        for (let j = 0; j < feed[i].course.length; j++)
                        {
                            if (isNumber(feed[i].course[j]))
                            {
                                count++;
                            }
                        }
                        if (count < 3)
                        {
                            returnArray.push(feed[i].course);
                        }
                    }
                }
                else if ((feed[i].course.includes(req.query.alternative)))
                {
                    returnArray.push(feed[i].course);
                }
            }
            else{
                returnArray.push(feed[i].course);
            }
        }
    }
    returnArray.sort();
    res.json(returnArray);
})

app.get('/tutorlist', async (req, res) => {
    const feed = await Post.find();

    let returnArray = new Array;
    for (let i = 0; i < feed.length; i++)
    {
        if ((feed[i].subject.includes(req.query.series)))
        {
            returnArray.push(feed[i].member);
        }
    }

    res.json(returnArray);
})

app.get('/find/appointment/info', async (req, res) => {
    const feed = await Request.find();
    const feed1 = await Email.find();
    const feed2 = await Post.find();

    let response = false;

    let memberEmail = "";

    const identity = req.query.info[6];

    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].timestamp === identity && feed[i].tutor === req.query.info[2] && feed[i].date === req.query.info[4])
        {
            if ((feed[i]._id.toString()).substring((feed[i]._id.toString()).length - 5, (feed[i]._id.toString()).length) === req.query.code)
            {
                let username = "";
                if (req.query.info[1].includes("@g.ucla.edu"))
                {
                    username = req.query.info[1].replace("@g.ucla.edu", "");
                }
                else if (req.query.info[1].includes("@ucla.edu"))
                {
                    username = req.query.info[1].replace("@ucla.edu", "");
                }

                for (let j = 0; j < feed1.length; j++)
                {
                    if (feed1[j].email === username)
                    {
                        const id = feed1[j]._id;
                        const post = await Email.findByIdAndUpdate(id, {
                            bookings: feed1[j].bookings.replace(dateEncoder(req.query.info[4]), ""),
                        }, { new: true });
                        post.save();
                        break;
                    }
                }

                for (let j = 0; j < feed2.length; j++)
                {
                    if (feed2[j].member === req.query.info[2])
                    {
                        const id = feed2[j]._id;
                        memberEmail = feed2[j].email;
                        const post = await Post.findByIdAndUpdate(id, {
                            booking: feed2[j].booking.replace(dateEncoder(req.query.info[4]), ""),
                        }, { new: true });
                        post.save();
                        break;
                    }
                }

                const result = await Request.findByIdAndDelete(feed[i]._id);

                const message = "Dear " + result.tutor + ",\n\nYour appointment with " + result.student + " has been cancelled." + 
                "\nBelow were the details:\n"
                + "Student: " + result.student + "\n"
                + "Email: " + result.email + "\n"
                + "Subject: " + result.subject + "\n"
                + "Date: " + result.date + "\n"
                + "Phone: " + result.phone + "\n"
                + "Request: " + result.request + "\n"
                + "\nSincerely,\nArthur Huang and Claire Luong";

                const options = {
                    from: "axstutoring@zohomail.com",
                    to: memberEmail,
                    subject: "AXS Tutoring - Appointment Cancelled",
                    text: message,
                };
                
                new Promise((resolve, reject) => {
                    transporter.sendMail(options, function (err, info){
                        if (err)
                        {
                            reject(err);
                        }
                        else
                        {
                            resolve("email sent");
                        }
                        //console.log("Sent", info.response);
                    });
                })

                const message1 = "Dear " + result.student + ",\n\nThis is a confirmation of your cancellation for tutoring with " 
                + result.tutor + " on " + result.date + " for " + result.subject + ". No further action is required." + 
                "\n\nSincerely,\nArthur Huang and Claire Luong"
                + "\n\n[Do not reply to this email. For all inquiries please contact us at tutoring.axsbg@gmail.com]";

                const options1 = {
                    from: "axstutoring@zohomail.com",
                    to: result.email,
                    subject: "AXS Tutoring - Appointment Cancellation",
                    text: message1,
                };
                
                new Promise((resolve, reject) => {
                    transporter.sendMail(options1, function (err, info){
                        if (err)
                        {
                            reject(err);
                        }
                        else
                        {
                            resolve("email sent");
                        }
                        //console.log("Sent", info.response);
                    });
                })
                response = true;
                break;
            }
        }
    }
    res.json(response);
})

app.get('/find/appointment', async (req, res) => {
    const feed = await Request.find();

    const feed2 = await Course.find();

    let returnArray = new Array(2).fill([]);
    let tempArray1 = [];
    let tempArray2 = [];
    //console.log(returnArray);

    let username = "";
    if (req.query.email.includes("@g.ucla.edu"))
    {
        username = req.query.email.replace("@g.ucla.edu", "");
    }
    else if (req.query.email.includes("@ucla.edu"))
    {
        username = req.query.email.replace("@ucla.edu", "");
    }

    //console.log(username);
    //console.log(todayDate);
    for (let i = 0; i < feed.length; i++)
    {
        //console.log(i);
        if ((feed[i].email === username + "@ucla.edu") || (feed[i].email === username + "@g.ucla.edu"))
        {
            //console.log(i);
            let hour = feed[i].date.substring(19, 24);
            if (feed[i].date.length === 26)
            {
                hour = "0" + feed[i].date.substring(19, 23);
            }
            if (feed[i].date.substring(feed[i].date.length - 2, feed[i].date.length) === "PM" && hour.substring(0, 2) !== "12")
            {
                let hourNumber = Number(hour.substring(0, 2)) + 12;
                hour = hourNumber.toString() + hour.substring(2, 5);
            }
            //console.log(hour);
            const dateTranslator = Date.parse(feed[i].date.substring(4, 15) + ' ' + hour);
            //console.log(dateTranslator);
            const todayDate = Date.now();
            //console.log(dateTranslator > todayDate && !Boolean(req.query.past))
            if (dateTranslator > todayDate)
            {
                //console.log("0");
                for (let j = 0; j < feed2.length; j++)
                {
                    if (feed2[j].course === feed[i].subject)
                    {
                        for (let k = feed2[j].subjectDivision.length - 1; k >= 0; k--)
                        {
                            if (feed2[j].subjectDivision[k])
                            {
                                const template = [feed[i].student, feed[i].email, feed[i].tutor, 
                                                    feed[i].subject, feed[i].date, k, feed[i].timestamp];
                                //console.log(0);
                                tempArray1.push(template);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            //console.log((dateTranslator <= todayDate) && req.query.past);
            // todayDate = Date.now();
            // console.log(dateTranslator);
            // console.log(todayDate);
            // console.log(Boolean(req.query.past));

            // const bbbb = ((Number(dateTranslator) <= Number(todayDate)) && Boolean(req.query.past));
            // console.log((Number(dateTranslator) <= Number(todayDate)) && Boolean(req.query.past));
            //console.log(typeof (Number(dateTranslator) <= Number(todayDate)) && Boolean(req.query.past));
            if ((Number(dateTranslator) <= Number(todayDate)))
            {
                //console.log((Number(dateTranslator) <= Number(todayDate)) && Boolean(req.query.past));
                // console.log("Why?");
                // console.log("");
                //console.log(((dateTranslator <= todayDate) && req.query.past));
                for (let j = 0; j < feed2.length; j++)
                {
                    if (feed2[j].course === feed[i].subject)
                    {
                        for (let k = feed2[j].subjectDivision.length - 1; k >= 0; k--)
                        {
                            if (feed2[j].subjectDivision[k])
                            {
                                const template = [feed[i].student, feed[i].email, feed[i].tutor, 
                                                    feed[i].subject, feed[i].date, k];
                                //console.log(template);
                                tempArray2.push(template);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    tempArray1.sort((a, b) => {
        firstDate = Date.parse(a[4].substring(4, 15));
        secondDate = Date.parse(b[4].substring(4, 15));
        //console.log(firstDate);
        //console.log(secondDate);
        if (firstDate > secondDate)
        {
            return 1;
        }
        else
        {
            if (firstDate === secondDate)
            {
                //console.log(a.substring(a.length - 2, a.length));
                //console.log(b.substring(b.length - 2, b.length));
                if (a[4].substring(a[4].length - 2, a[4].length) > b[4].substring(b[4].length - 2, b[4].length))
                {
                    return 1;
                }
                else
                {
                    if (a[4].substring(a[4].length - 2, a[4].length) === b[4].substring(b[4].length - 2, b[4].length))
                    {
                        let firstHour = a[4].substring(19, 24);
                        let secondHour = b[4].substring(19, 24);
                        if (a[4].length === 26)
                        {
                            firstHour = "0" + a[4].substring(19, 23);
                        }
                        if (b[4].length === 26)
                        {
                            secondHour = "0" + b[4].substring(19, 23);
                        }
                        //console.log(firstHour);
                        //console.log(secondHour);
                        if (firstHour > secondHour)
                        {
                            return 1;
                        }
                    }
                }
            }
        }
        return -1;
    })
    tempArray2.sort((a, b) => {
        firstDate = Date.parse(a[4].substring(4, 15));
        secondDate = Date.parse(b[4].substring(4, 15));
        //console.log(firstDate);
        //console.log(secondDate);
        if (firstDate > secondDate)
        {
            return 1;
        }
        else
        {
            if (firstDate === secondDate)
            {
                //console.log(a.substring(a.length - 2, a.length));
                //console.log(b.substring(b.length - 2, b.length));
                if (a[4].substring(a[4].length - 2, a[4].length) > b[4].substring(b[4].length - 2, b[4].length))
                {
                    return 1;
                }
                else
                {
                    if (a[4].substring(a[4].length - 2, a[4].length) === b[4].substring(b[4].length - 2, b[4].length))
                    {
                        let firstHour = a[4].substring(19, 24);
                        let secondHour = b[4].substring(19, 24);
                        if (a[4].length === 26)
                        {
                            firstHour = "0" + a[4].substring(19, 23);
                        }
                        if (b[4].length === 26)
                        {
                            secondHour = "0" + b[4].substring(19, 23);
                        }
                        //console.log(firstHour);
                        //console.log(secondHour);
                        if (firstHour > secondHour)
                        {
                            return 1;
                        }
                    }
                }
            }
        }
        return -1;
    })
    returnArray[0] = tempArray1;
    returnArray[1] = tempArray2;
    res.json(returnArray);
})

app.get('/datelist', async (req, res) => {
    const feed = await Post.find();

    let week = new Array;

    for (let i = 0; i < 7; i++)
    {
        let hour = new Array(48).fill(false);
        week.push(hour);
    }

    let returnArray = [];
    let updatedString = "";
    let maxHours = 0;
    let dayOffStart = 0;
    let dayOffEnd = 0;

    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].member === req.query.memberName)
        {
            dayOffStart = feed[i].off[0];
            dayOffEnd = feed[i].off[1];
            maxHours = feed[i].maximumHours;
            for (let j = 0; j < feed[i].availability.length; j+=3)
            {
                week[Number(feed[i].availability[j])][Number(feed[i].availability[j + 1] + feed[i].availability[j + 2])] = true;
            }
            const todayDate = new Date();
            //console.log(todayDate);
            let dateString = todayDate.getFullYear().toString();
            if (todayDate.getMonth() < 9)
            {
                dateString += "0";
            }
            dateString += (todayDate.getMonth() + 1).toString();
            if (todayDate.getDate() < 10)
            {
                dateString += "0";
            }
            dateString += todayDate.getDate().toString();
            //console.log(dateString);

            for (let j = 1; j < feed[i].booking.length; j+=13)
            {
                let bookingString = feed[i].booking.substring(j + 3, j + 11)
                if (bookingString > dateString)
                {
                    updatedString += feed[i].booking.substring(j - 1, j + 12);
                }
            }
            
            for (let j = 1; j < updatedString.length; j+=13)
            {
                for (let k = 0; k < 4; k++)
                {
                    week[Number(updatedString[j])][Number(updatedString[j + 1] + updatedString[j + 2]) + k] = false;
                }
            }

            const id = feed[i]._id;
            const post = await Post.findByIdAndUpdate(id, {
                booking: updatedString,
            }, { new: true });
        
            post.save();
            //console.log(week);
            break;
        }
    }

    //console.log(week);

    let dateObject = new Date();

    for (let i = dateObject.getDay() + 1; i < 7; i++)
    {
        for (let j = 0; j < 48; j++)
        {
            if (week[i][j])
            {
                if (j > 44)
                {
                    break;
                }
                let check = false;
                for (k = 0; k < 4; k++)
                {
                    if (!week[i][j+k])
                    {
                        check = true;
                        break;
                    }
                }
                if (check)
                {
                    break;
                }
                let dayOfWeek = i;
                //console.log(i);
                dateObject = new Date();
                //console.log(dateObject);
                //console.log(dayOfWeek);
                //console.log(currentDate.getDay());
                if (dateObject.getDay() >= dayOfWeek)
                {
                    dayOfWeek += 7;
                }
                //console.log(dayOfWeek);
                //console.log(currentDate.getDay());
                if (dayOfWeek - dateObject.getDay() > 2)
                {
                    dateObject.setDate(dayOfWeek - dateObject.getDay() + dateObject.getDate());
                    if ((dayOffStart > Date.parse(dateObject)) || (Date.parse(dateObject) > dayOffEnd))
                    {
                        returnArray.push(dateObject.toDateString() + " at " + timeTable[j]);
                    }
                    //console.log(futureDate.toDateString() + " at " + timeTable[j]);
                }
                else if (dayOfWeek - dateObject.getDay() === 2 && dateObject.getHours() < (j*0.25 + 8))
                {
                    dateObject.setDate(dayOfWeek - dateObject.getDay() + dateObject.getDate());
                    if ((dayOffStart > Date.parse(dateObject)) || (Date.parse(dateObject) > dayOffEnd))
                    {
                        returnArray.push(dateObject.toDateString() + " at " + timeTable[j]);
                    }
                }
            }
        }
    }

    dateObject = new Date();

    for (let i = 0; i < dateObject.getDay() + 1; i++)
    {
        for (let j = 0; j < 48; j++)
        {
            if (week[i][j])
            {
                if (j > 44)
                {
                    break;
                }
                let check = false;
                for (k = 0; k < 4; k++)
                {
                    if (!week[i][j+k])
                    {
                        check = true;
                        break;
                    }
                }
                if (check)
                {
                    break;
                }
                let dayOfWeek = i;
                //console.log(i);
                const dateObject = new Date();
                //console.log(dayOfWeek);
                //console.log(currentDate.getDay());
                if (dateObject.getDay() >= dayOfWeek)
                {
                    dayOfWeek += 7;
                }
                //console.log(dayOfWeek);
                //console.log(currentDate.getDay());
                if (dayOfWeek - dateObject.getDay() > 2)
                {
                    dateObject.setDate(dayOfWeek - dateObject.getDay() + dateObject.getDate());
                    //console.log(futureDate.toDateString() + " at " + timeTable[j]);
                    if ((dayOffStart > Date.parse(dateObject)) || (Date.parse(dateObject) > dayOffEnd))
                    {
                        returnArray.push(dateObject.toDateString() + " at " + timeTable[j]);
                    }
                }
                else if (dayOfWeek - dateObject.getDay() === 2 && dateObject.getHours() < (j*0.25 + 8))
                {
                    dateObject.setDate(dayOfWeek - dateObject.getDay() + dateObject.getDate());
                    if ((dayOffStart > Date.parse(dateObject)) || (Date.parse(dateObject) > dayOffEnd))
                    {
                        returnArray.push(dateObject.toDateString() + " at " + timeTable[j]);
                    }
                }
            }
        }
    }
    //console.log(week);

    if (updatedString.length / 13 >= maxHours)
    {
        returnArray = [];
    }

    res.json(returnArray);
})

app.post('/request/new', async (req, res) => {

    const feed = await Post.find();

    let memberEmail = "";

    dateProcessor = dateEncoder(req.body.date);

    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].member === req.body.tutor)
        {
            memberEmail = feed[i].email;
            const id = feed[i]._id;
            const booking = feed[i].booking;
            try {
                const post = await Post.findByIdAndUpdate(id, {
                    booking: booking + dateProcessor,
              }, { new: true });
          
              post.save();
              
            } catch (err) {
              console.error(err);
              //res.status(500).send('Server Error');
            }
            break;
        }
    }
    const post = new Request({
        student: req.body.student,
        email: req.body.email,
        phone: req.body.phone,
        request: req.body.request,
        tutor: req.body.tutor,
        subject: req.body.subject,
        date: req.body.date,
        timestamp: Date(Date.now()),
    });
    
    const message = "Dear " + req.body.tutor + ",\n\nYou have received a new appointment with " + req.body.student + ".\nBelow are the details:\n"
    + "Student: " + req.body.student + "\n"
    + "Email: " + req.body.email + "\n"
    + "Subject: " + req.body.subject + "\n"
    + "Date: " + req.body.date + "\n"
    + "Phone: " + req.body.phone + "\n"
    + "Request: " + req.body.request + "\n"
    + "\nSincerely,\nArthur Huang and Claire Luong";

    const options = {
        from: "axstutoring@zohomail.com",
        to: memberEmail,
        subject: "AXS Tutoring - New Appointment",
        text: message,
    };
    
    new Promise((resolve, reject) => {
        transporter.sendMail(options, function (err, info){
            if (err)
            {
                reject(err);
            }
            else
            {
                resolve("email sent");
            }
            //console.log("Sent", info.response);
        });
    })

    const message1 = "Dear " + req.body.student + ",\n\nThis is a confirmation of your request for tutoring with " 
    + req.body.tutor + " on " + req.body.date + " for " + req.body.subject + ". Please email them" +  
    " the materials that you would like to go over 24 hours before the scheduled appointment time at " + memberEmail +
    ".\n\nAppointment ID: " + (post._id.toString()).substring((post._id.toString()).length - 5, (post._id.toString()).length) +
    "\n\nThank you for choosing AXS Tutoring.\n\nSincerely,\nArthur Huang and Claire Luong"
    + "\n\n[Do not reply to this email. For all inquiries please contact us at tutoring.axsbg@gmail.com]";

    const options1 = {
        from: "axstutoring@zohomail.com",
        to: req.body.email,
        subject: "AXS Tutoring - Appointment Confirmation - " + (post._id.toString()).substring((post._id.toString()).length - 5, (post._id.toString()).length),
        text: message1,
    };
    
    new Promise((resolve, reject) => {
        transporter.sendMail(options1, function (err, info){
            if (err)
            {
                reject(err);
            }
            else
            {
                resolve("email sent");
            }
            //console.log("Sent", info.response);
        });
    })

    const feed1 = await Email.find();

    let username = "";
    if (req.body.email.includes("@g.ucla.edu"))
    {
        username = req.body.email.replace("@g.ucla.edu", "");
    }
    else if (req.body.email.includes("@ucla.edu"))
    {
        username = req.body.email.replace("@ucla.edu", "");
    }

    for (let i = 0; i < feed1.length; i++)
    {
        if (feed1[i].email === username)
        {
            const id = feed1[i]._id;
            const booking = feed1[i].bookings;
            if (booking.length === 0 || booking[0] === "-")
            {
                const post1 = await Email.findByIdAndUpdate(id, {
                    bookings: dateProcessor,
                }, { new: true });
              
                post1.save();
            }
            else{
                const post1 = await Email.findByIdAndUpdate(id, {
                    bookings: booking + dateProcessor,
                }, { new: true });
              
                post1.save();
            }
            
        }
    }

    post.save();
    res.json(post);
})

app.put('/feed/edit', async (req, res) => {
    const feed = await Post.find();

    dateProcessor = dateEncoder(req.body.booking);

    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].member === req.body.memberName)
        {
            /*
            const message = "Dear " + req.body.student + ",\n\nThis is a confirmation of your request for tutoring with " 
            + req.body.memberName + " on " + req.body.booking + " for " + req.body.subject + ". Please email them" +  
            " the materials that you would like to go over 24 hours before the scheduled appointment time at " + feed[i].email +
            ".\n\nAppointment ID: " + 
            ".\n\nThank you for choosing AXS Tutoring.\n\nSincerely,\nArthur Huang and Claire Luong"
            + "\n\n[Do not reply to this email. For all inquiries please contact us at tutoring.axsbg@gmail.com]";

            const options = {
                from: "axstutoring@zohomail.com",
                to: req.body.email,
                subject: "AXS Tutoring - Appointment Confirmation",
                text: message,
            };
            
            transporter.sendMail(options, function (err, info){
                if (err)
                {
                    console.log(err);
                    return;
                }
                //console.log("Sent", info.response);
            })
            */

            // const id = feed[i]._id;
            // const booking = feed[i].booking;
            // try {
            //     const post = await Post.findByIdAndUpdate(id, {
            //         booking: booking + dateProcessor,
            //   }, { new: true });
          
            //   post.save();
            //   res.json(post);
              
            // } catch (err) {
            //   console.error(err);
            //   res.status(500).send('Server Error');
            // }
            break;
        }
    }

    const feed1 = await Email.find();

    let username = "";
    if (req.body.email.includes("@g.ucla.edu"))
    {
        username = req.body.email.replace("@g.ucla.edu", "");
    }
    else if (req.body.email.includes("@ucla.edu"))
    {
        username = req.body.email.replace("@ucla.edu", "");
    }

    for (let i = 0; i < feed1.length; i++)
    {
        if (feed1[i].email === username)
        {
            const id = feed1[i]._id;
            const booking = feed1[i].bookings;
            if (booking.length === 0 || booking[0] === "-")
            {
                const post = await Email.findByIdAndUpdate(id, {
                    bookings: dateProcessor,
                }, { new: true });
              
                post.save();
            }
            else{
                const post = await Email.findByIdAndUpdate(id, {
                    bookings: booking + dateProcessor,
                }, { new: true });
              
                post.save();
            }
            
        }
    }
    //post.timestamp = Date(date.now());
    //post.save();
})

app.delete('/feed/delete/:_id', async (req, res) => {
    const result = await Post.findByIdAndDelete(req.params._id);

    res.json(result);
})

/*

const newPost = new Post({
    student: "Kaiway Tang",
    email: "kaiway@ucla.edu",
    phone: 9098569901,
    request: "",
    tutor: "Kevin Tang",
    subject: "CS32",
    date: Date(Date.now()),
    timestamp: Date.now(),
})

newPost.save();

*/