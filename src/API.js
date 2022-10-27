import axios from "axios";
import moment from "moment";

export const fetchNotes = async (context) => {
	console.log("Fetching notes");
	const response = await axios.get("/note/findAll");

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

export const fetchNoteById = async (id) => {
	console.log("Fetching note by id: " + id);

	const res = await axios.get(`/note/${id}`);
	const data = {
		...res.data,
		content: JSON.parse(res.data.content),
	}
	return data;
}
