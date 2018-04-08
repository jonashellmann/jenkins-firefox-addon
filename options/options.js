var jobNumber = 0;
var getSettings = browser.storage.local.get("settings");
getSettings.then((res) => {
	const {settings} = res;
	document.querySelector("#baseurl").value = settings.baseurl;
	for (job in settings.jobs) {
		jobNumber = jobNumber + 1;
		var input = document.createElement("input");
		input.id = "job" + jobNumber;
		input.type = "text";
		input.value = job.name;
		document.querySelector("#jobs").appendChild(input);
	}
});

function addJob(e) {
	jobNumber = jobNumber + 1;
	var input = document.createElement('input');
	input.id = "job" + jobNumber;
	input.type = "text";
	document.querySelector("#jobs").appendChild(input);
}

function removeJob(e) {
	var input = document.querySelector("#job" + jobNumber);
	jobNumber = jobNumber - 1;
	input.parentNode.removeChild(input);
}

function saveOptions(e) {
	var settings = {
		settings: {
			baseurl: document.querySelector("baseurl").value
			jobs: [];
		}
	};

	// Add jobs here dynamically
	// https://stackoverflow.com/questions/2250953/how-do-i-create-javascript-array-json-format-dynamically
	    
	var result = browser.storage.local.set(settings);
	browser.runtime.sendMessage({
		type: "settings-updated",
		message: settings,
	});    
	e.preventDefault();
}

document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#jobAdder").addEventListener("click", addJob);
document.querySelector("#jobRemover").addEventListener("click", removeJob);
