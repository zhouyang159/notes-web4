import axios from "axios";
import moment from "moment";
import Quill from "quill";

export const fetchProfile = async (username) => {
	console.log("Fetch profile");
	const response = await axios.get(`/user/${username}/profile`);


	let profile = response.data;
	if (!profile?.backgroundColor) {
		const initColors = [
			{
				color: "skyblue",
				active: false,
			},
			{
				color: "gray",
				active: false,
			},
			{
				color: "yellow",
				active: false,
			},
			{
				color: "green",
				active: false,
			},
			{
				color: "orange",
				active: false,
			},
			{
				color: "red",
				active: false,
			},
		]
		profile.backgroundColor = initColors;
	} else {
		profile = {
			...profile,
			backgroundColor: JSON.parse(profile?.backgroundColor),
		}
	}

	if (profile.hasNotePassword) {
		profile = {
			...profile,
			lockNote: true,
		}
	}
	return profile;
}

export const fetchNotes = async ({ signal }) => {
	console.log("Fetch all notes");

	const response = await axios.get("/note/findAll", { signal });

	
	const div1 = document.createElement("div");
	div1.style.display = "none";
	const div2 = document.createElement("div");
	div2.setAttribute("id", "temp-toolbar");
	const div3 = document.createElement("div");
	div3.setAttribute("id", "temp-editor-container");
	div1.appendChild(div2);
	div1.appendChild(div3);
	document.querySelector("#MainContainer").appendChild(div1);
	
	
	const options = {
		modules: {
			toolbar: '#temp-toolbar'
		},
		placeholder: 'Compose an epic...',
		readOnly: true,
		theme: 'snow'
	};
	let quill = new Quill("#temp-editor-container", options);

	let list = response.data.map((note) => {
		quill.setContents(JSON.parse(note.content));

		return {
			...note,
			content: quill.getContents,
			text: quill.getText(),
			createTime: moment(note.createTime),
			updateTime: moment(note.updateTime),
			deleteTime: moment(note.deleteTime),
		}
	});
	div1.remove();

	list.sort((a, b) => {
		return a.number - b.number;
	});

	return list;
}

export const fetchNoteById = async (id) => {
	console.log("Fetch note by id: " + id);

	const res = await axios.get(`/note/${id}`);
	const data = {
		...res.data,
		content: JSON.parse(res.data.content),
	}
	return data;
}
