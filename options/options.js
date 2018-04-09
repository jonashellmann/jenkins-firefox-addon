var jobNumber = 0;

function restoreOptions() {
	var getSettings = browser.storage.local.get("settings");
	getSettings.then((res) => {
		const {settings} = res;
		document.querySelector("#baseurl").value = settings.baseurl;
		document.querySelector("#updateinterval").value = settings.updateinterval;
		for (i in settings.jobs) {
			var job = settings.jobs[i];
			jobNumber = jobNumber + 1;
			var input = document.createElement("input");
			input.id = "job" + jobNumber;
			input.className = "jobinput";
			input.type = "text";
			input.value = job.name;
			document.querySelector("#jobs").appendChild(input);
		}
	});	
}

function addJob(e) {
	jobNumber = jobNumber + 1;
	var input = document.createElement('input');
	input.id = "job" + jobNumber;
	input.className = "jobinput";
	input.type = "text";
	document.querySelector("#jobs").appendChild(input);
}

function removeJob(e) {
	var input = document.querySelector("#job" + jobNumber);
	jobNumber = jobNumber - 1;
	input.parentNode.removeChild(input);
}

function saveOptions(e) {
	var baseurl = document.querySelector("#baseurl").value
	if (baseurl.substr(-1) != '/') {
        baseurl = baseurl + '/';
    }
	
	var settings = {
		settings: {
			baseurl: baseurl,
			updateinterval: parseInt(document.querySelector("#updateinterval").value, 10),
			jobs: []
		},
	};

	var jobinputs = document.getElementsByClassName("jobinput");
	for(var i = 0; i < jobinputs.length; i++) {
		settings.settings.jobs.push({
			name: jobinputs[i].value
		});
	}

	var result = browser.storage.local.set(settings);
	browser.runtime.sendMessage({
		type: "settings-updated",
		message: settings,
	});    
	e.preventDefault();
}

restoreOptions();
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#jobAdder").addEventListener("click", addJob);
document.querySelector("#jobRemover").addEventListener("click", removeJob);
