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


