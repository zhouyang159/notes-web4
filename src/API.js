import axios from "axios";
import moment from "moment";

export const fetchProfile = async (username) => {
	console.log("Fetch profile");
	const response = await axios.get(`/user/${username}/profile`);

	let profile = response.data;
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

	let list = response.data.map((note) => {
		return {
			...note,
			content: JSON.parse(note.content),
			createTime: moment(note.createTime),
			updateTime: moment(note.updateTime),
			deleteTime: moment(note.deleteTime),
		}
	});

	return list;
}

export const fetchNoteById = async (id, { signal }) => {
	console.log("Fetch note by id: " + id);

	const res = await axios.get(`/note/${id}`, { signal });
	const data = {
		...res.data,
		content: JSON.parse(res.data.content),
	}
	return data;
}
