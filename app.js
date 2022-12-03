//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

var dir_name = 'test';
var upload_names = new Set();
var upload_count = 0;
console.log(upload_count);

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
const patient_form = document.getElementById("detail-form");
var dirs=new XMLHttpRequest();
dirs.onload=function() {
		if(this.readyState === 4) {
				console.log("Server returned: ", upload_names, dir_name);
		}
};
dirs.onerror = function() {
		alert("Request failed");
};

dirs.open("GET","list_dirs.php",true);
dirs.onreadystatechange = function () {
	if (this.readyState == 3) {
	var res = this.responseText;
	var data = JSON.parse(res);
	if (data) {
	console.log(data.length);
 	dir_name = data.length + 1;}
	else {
		dir_name = 1
	}
}
}
dirs.send();


//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
recordButton.addEventListener("click", autoStopRecording);
stopButton.addEventListener("click", stopRecording);
patient_form.addEventListener("submit", submit_form);

function save_to_recordings_list(val) {
	upload_names.add(val);
	console.log(upload_names, upload_names.size);
	if (upload_names.size) {
		upload_count = upload_names.size;
	}
}

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia()
	*/

	/*
    	We're using the standard promise based getUserMedia()
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

    recordButton.disabled = true;
    stopButton.disabled = false;

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		//update the format
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/*
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function autoStopRecording() {
  setTimeout(stopRecording, 4000)
}

function stopRecording() {

	console.log("Record button disabled = "+recordButton.disabled);

	//disable the stop button, enable the record too allow for new recordings
	// This if condition not working. Need to think of a way to correct this.
	if (!stopButton.disabled) {
		console.log("stopButton clicked");
		stopButton.disabled = true;
		recordButton.disabled = false;


		//tell the recorder to stop the recording
		rec.stop();

		//stop microphone access
		gumStream.getAudioTracks()[0].stop();

		//create the wav blob and pass it on to createDownloadLink
		rec.exportWAV(createDownloadLink);
	}
}

function createDownloadLink(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString().split(":").join("_").split('.')[0];
	console.log("output file name = "+filename);

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);

	//add the filename to the li
	li.appendChild(document.createTextNode(filename+".wav"))

	//add the save to disk link to li
	li.appendChild(link);

	//upload link
	var upload = document.createElement('a');
	upload.href="#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function(event){
		  var xhr=new XMLHttpRequest();
		  xhr.onload=function(e) {
		      if(this.readyState === 4) {
		          console.log("Server returned: ",e.target.responseText);
		      }
		  };
			xhr.onerror = function() {
  				alert("Request failed");
			};

		  var fd=new FormData();
		  fd.append("audio_data",blob, filename);
			// var bl = new FormData();
			// bl.append('sec_dir', dir_name);
			// bl.append('create_dir', create_dir);
			// fd.append("dir_info", bl, 'd');
			console.log(fd);
			xhr.open("POST","upload.php?sec_dir="+dir_name+"&upload_count="+upload_count+"",true);
			// xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		// 	xhr.onreadystatechange = function() {
		// 		var bl = new FormData();
		// 		bl.append('sec_dir', dir_name);
		// 		bl.append('create_dir', create_dir);
		// 		fetch ("upload.php", { method: "POST", body: bl}).then((result) => {
		// 		if (result.status != 200) { throw new Error("Bad Server Response"); }
		// 		return result.text();
		// 	}).then((response) => {
		// 	console.log(response);
		// 	}).catch((error) => { console.log(error); });
		// };
			// xhr.send(bl);
			// xhr.open("POST","upload.php",true);
		  xhr.send(fd);

			if (!xhr.status != 200) {
			li.appendChild(document.createTextNode ("  Uploaded succesfully!!"));
			save_to_recordings_list(filename);
			}
			else {
				alert("File not uploaded");
			};
	})
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
}

function submit_form(evt) {

	const XHR = new XMLHttpRequest();
  const FD = new FormData(patient_form);

  // Push our data into our FormData object
  // for (const [name, value] of Object.entries(evt)) {
  //   FD.append(name, value);
  // }
	XHR.onload=function(e) {
			if(this.readyState === 4) {
					console.log("Server returned: ",e.target.responseText);
			}
	};
	XHR.onerror = function() {
			alert("Request failed");
	};

	// var bl = new FormData();
	// bl.append('sec_dir', dir_name);
	// bl.append('create_dir', create_dir);
	// fd.append("dir_info", bl, 'd');
	XHR.open("POST","upload_form.php?sec_dir="+dir_name+"&upload_count="+upload_count+"",true);
  // const contact_forms = document.getElementsByClassName('contact-form');
	console.log(FD);
	// TODO: Change count from 2 to 5
	if (upload_count < 2) {
		alert('At least 5 recordings must be submitted!!');
		evt.preventDefault();
	}
	else{
		XHR.send(FD);
		if (!XHR.status != 200) {
			evt.preventDefault();
		// alert('Details added succesfully!!');
		}
		else {
			alert("Form details could not be uploaded");
			evt.preventDefault();
		};


	}

}
