var
    tempH = 0,
    tempM = 0,
    tempS = 0;
var h = 0,
    m = 0,
    s = 0,
    start = 0,
    running = 0,
    userSeconds = 0,
    // Entered Time
    hh = 0,
    mm = 0,
    ss = 0;
// for total seconds that is spent
var totalSeconds = 0;
// array for total spent time
var timeArr = [];
// task complete song
var audio = new Audio("audio.ogg");

function sleep(ms) {
    // workerTimer is webworker for timer
    return new Promise(resolve => workerTimer.setInterval(resolve, ms));
}

// reset the recor
function resetRecords() {
    total.innerHTML = "00:00:00";
    timeArr = [];
    localStorage.removeItem("records");
    records.innerHTML = "";
}

// Reset all the data
function reset() {
    h = 0;
    m = 0;
    s = 0;
    start = 0;
    running = 0;
    time.innerHTML = "00:00:00";
    startbtn.innerText = "Start";
    startbtn.style.backgroundColor = "burlywood";
    startbtn.style.color = "black";
    calcTime();
}

// for input time seconds to time converter H:M:S
function calcTime() {
    var tin = timeIn.value;
    var calcT = document.getElementById("calcT");
    ss = parseInt(tin % 60);
    mm = parseInt((tin / 60) % 60)
    hh = parseInt((tin / 60) / 60);
    if (tin == 0 || tin == "") {
        calcT.innerHTML = "please enter time";
        return;
    }
    let hours = ((hh <= 9) ? ("0" + hh) : hh),
        minutes = ((mm <= 9) ? ("0" + mm) : mm),
        seconds = ((ss <= 9) ? ("0" + ss) : ss);
    calcT.innerHTML = ((hours == "00") ? "" : ("<span class='colorTime'>" + hours + "</span> hours, ")) + ((minutes == "00" && hours == "00") ? "" : ("<span class='colorTime'>" + minutes + "</span> minutes and ")) + ((seconds == "00" && minutes == "00" && hours == "00") ? "" : ("<span class='colorTime'>" + seconds + "</span> seconds"));
    if (running == 0) {
        h = hh;
        m = mm;
        s = ss;
    }
}
calcTime();
// format the time to string
function formatTime(hhh, mmm, sss, i = 0, color = 0) {
    if (color == 1) {
        return (((i + 1) + ". Completed <span class='colorTime'>" + ((hhh <= 9) ? ("0" + hhh) : hhh) + "</span>:<span class='colorTime'>" + ((mmm <= 9) ? ("0" + mmm) : mmm) + "</span>:<span class='colorTime'>" + ((sss <= 9) ? ("0" + sss) : sss) + "</span>" + "<br>"));
    }
    return ((((hhh <= 9) ? ("0" + hhh) : hhh) + ":" + ((mmm <= 9) ? ("0" + mmm) : mmm) + ":" + ((sss <= 9) ? ("0" + sss) : sss)));
}

// seconds to hh:mm:ss converter
function secondsToTime(seconds) {
    let temps = parseInt(seconds % 60);
    let tempm = parseInt((seconds / 60) % 60)
    let temph = parseInt((seconds / 60) / 60);
    return (((temph <= 9) ? ("0" + temph) : temph) + ":" + ((tempm <= 9) ? ("0" + tempm) : tempm) + ":" + ((temps <= 9) ? ("0" + temps) : temps));
}

// show name
function showName() {
    if (nameIn.value != "")
        shName.innerHTML = nameIn.value + "'s ";
}

async function startTime() {
    if (timeIn.value == 0 || timeIn.value == "") {
        return;
    }
    running = 1;
    if (start == 1) {
        startbtn.innerText = "Start";
        startbtn.style.backgroundColor = "green";
    } else {
        startbtn.style.backgroundColor = "red";
        startbtn.innerText = "Pause";
    }
    start = (start == 0 ? 1 : 0);
    while (start == 1) {
        document.title = "Time " + (formatTime(h, m, s))
        time.innerHTML = formatTime(h, m, s);
        if ((h == 0 && m == 0 && s == 0)) {
            running = 0;
            // for saving the completed time
            if (hh != 0 || mm != 0 || ss != 0){
                timeArr.unshift([hh, mm, ss]);
                localStorage.setItem("records",JSON.stringify(timeArr));
            }

            startbtn.innerText = "Start";
            startbtn.style.backgroundColor = "burlywood";
            startbtn.style.color = "black";
            start = 0;
            records.innerHTML = "";
            // playing song
            audio.play();
            // for Updating record and total time
            updateRecords();
            break;
        }
        if (s == 0) {
            if (m > 0) {
                m--;
            } else if (m == 0 && h > 0) {
                m = 59;
                h--;
            }
            s = 60;
        }
        s--;
        await sleep(1000);
    }
}

// for updating records if it is stored 
if(localStorage.getItem("records")){
    timeArr = JSON.parse(localStorage.getItem("records"));
    updateRecords();
}

// update record funciton
function updateRecords(){
    let totalSeconds = 0;
    // for Updating record and total time
    for (let i = 0; i < timeArr.length; i++) {
        let hour = timeArr[i][0],
            minutes = timeArr[i][1],
            second = timeArr[i][2];
        // showing record data
        records.innerHTML += formatTime(hour, minutes, second, i, 1)
            // calculating total seconds & convert into time
        totalSeconds += second + (minutes * 60) + (hour * 3600);
    }
    calcTime();
    // showing the total time
    total.innerHTML = secondsToTime(totalSeconds);
}

// for webworkers so the timer is now slowdown
var worker = new Worker('timer-worker.js')
var workerTimer = {
    id: 0,
    callbacks: {},
    setInterval: function(cb, interval, context) {
        this.id++
        var id = this.id
        this.callbacks[id] = { fn: cb, context: context }
        worker.postMessage({
            command: 'interval:start',
            interval: interval,
            id: id
        })
        return id
    },
    onMessage: function(e) {
        switch (e.data.message) {
            case 'interval:tick':
                var callback = this.callbacks[e.data.id]
                if (callback && callback.fn) callback.fn.apply(callback.context)
                break
            case 'interval:cleared':
                delete this.callbacks[e.data.id]
                break
        }
    },
    clearInterval: function(id) {
        worker.postMessage({ command: 'interval:clear', id: id })
    }
}
worker.onmessage = workerTimer.onMessage.bind(workerTimer)
