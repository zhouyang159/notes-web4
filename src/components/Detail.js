import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'
import moment from 'moment';


const DetailContainer = styled.div`
	height: 100%;
	width: 698px;
`;
const EditorContainer = styled.div`
	height: 93%;
`;

const Detail = (props) => {
	const { newId, createOrUpdateNote, curNote } = props;
	const didMount = useRef(false);
	const [quill, setQuill] = useState(null);
	const [textChangeHandler, setTextChangeHandler] = useState(() => {
		return () => { };
	});

	const getTextChangeHandler = (quill) => {
		return () => {
			let title = '';
			let str = JSON.stringify(quill.getText(0, 200));

			if (str.indexOf('\\n') !== -1 && str.indexOf('\\n') < 10) {
				title = str.slice(1, str.indexOf('\\n'));
			} else {
				title = str.slice(1, 10);
			}

			if (title === '') {
				title = 'New Note';
			}

			let newNote = {
				...curNote,
				title: title,
				content: quill.getContents(),
				updateTime: moment(),
			}

			createOrUpdateNote(newNote, newId);
		}
	}

	useEffect(() => {
		if (didMount.current === false) {
			return;
		}
		if (newId === null) {
			// when note create finish, we bind a new handler to quill
			quill.off('text-change', textChangeHandler);
			let newHandler = getTextChangeHandler(quill);
			quill.on('text-change', newHandler);
			setTextChangeHandler(() => newHandler);
		}
	}, [newId]);

	useEffect(() => {
		let toolbarOptions = [
			[{ 'header': [1, 2, 3, 4, 5, 6, false] }],
			['bold', 'strike'],        // toggled buttons
			['blockquote', 'code-block'],

			// [{ 'header': 1 }, { 'header': 2 }],               // custom button values
			[{ 'list': 'ordered' }, { 'list': 'bullet' }],
			// [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
			[{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
			// [{ 'direction': 'rtl' }],                         // text direction

			// [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown

			[{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
			// [{ 'font': [] }],
			// [{ 'align': [] }],

			['clean']                                         // remove formatting button
		];

		let quill = new Quill('#editor-container', {
			modules: {
				toolbar: toolbarOptions,
			},
			placeholder: 'type something here...',
			theme: 'snow',  // or 'bubble'，
		});
		setQuill(quill);
		quill.setContents(curNote.content);
		quill.focus();

		let handler = getTextChangeHandler(quill);
		quill.on('text-change', handler);
		setTextChangeHandler(() => handler);

		if (curNote.deleted === 1) {
			quill.enable(false);
		}

		didMount.current = true;
	}, []);


	return <DetailContainer className="Detail">
		<EditorContainer id="editor-container">
		</EditorContainer>
	</DetailContainer>
};

export default Detail;
