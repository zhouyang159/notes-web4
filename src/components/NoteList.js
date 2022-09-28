import React, { useState } from 'react';
import { message, Menu, Modal } from 'antd';
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? "#7ec1ff" : "",
	padding: "8px",
	width: 250
});

const getItemStyle = (isDragging, draggableStyle, active) => {
	let background = '';
	if (isDragging) {
		background = "#02e8be";
	} else if (active) {
		background = "#bfde3f";
	}

	return {
		padding: "16px 8px",
		borderBottom: "1px solid lightgray",
		background: background,
		...draggableStyle
	}
};


const { SubMenu } = Menu;

const ContextMenu = styled.div`
	display: none;
	background-color: #f4f4f4;
	width: 150px;
	z-index: 10;
	padding: 10px;
	border-radius: 5px;
	.item {
		padding: 3px;
		cursor: pointer;
		&:hover{
			background-color: bisque;
		}
	}
`;
const MenuItemContent = styled.div`
	line-height: 17px;
	.title {
		font-weight: bold;
		font-size: 16px;
	}
	.date {
		font-weight: normal;
		font-size: 12px;
	}
`;

const ConfirmContent = styled.div`
	text-align: center;
	.title {
		font-weight: bold;
	}
	.subTitle {
		font-weight: normal;
		color: #999;
	}
`;

const NoteList = (props) => {
	const { liveNoteList, setLiveNoteList, deletedNoteList, setDeletedNoteList, getNotes, updateNoteToServer } = props;

	const [curNote, setCurNote] = useState(null);

	const fakeDeleteNote = (note) => {
		let newNote = {
			...note,
			deleted: 1,
		}
		updateNoteToServer(newNote, getNotes);
	}

	const defaultNoteList = () => {
		//delete server side empty note.
		liveNoteList.forEach(item => {
			if (item.title === 'New Note') {
				axios.delete(`/note/${item.id}`).catch((err) => {
					message.error('delete note error');
					console.log(err);
				});
			}
		});

		setLiveNoteList((pre) => {
			return pre.filter((item) => item.title !== 'New Note').map((item) => {
				item.active = false;
				return item;
			});
		});
		setDeletedNoteList((pre) => {
			return pre.map((item) => {
				item.active = false;
				return item;
			});
		});
	}

	const handleClickLiveNote = (note) => {
		if (note.title === 'New Note') {
			return;
		}

		defaultNoteList();
		setTimeout(() => {
			setLiveNoteList((pre) => {
				return pre.map((item) => {
					if (item.id === note.id) {
						item.active = true;
					}
					return item;
				});
			});
		}, 20);
	}

	const handleClickDeletedNote = (note) => {

		defaultNoteList();
		setTimeout(() => {
			setDeletedNoteList((pre) => {
				return pre.map((item) => {
					if (item.id === note.id) {
						item.active = true;
					}
					return item;
				});
			});
		}, 20);
	}

	const getSelectedKeys = () => {
		let find = [...liveNoteList, ...deletedNoteList].find(note => note.active);
		if (find === undefined) {
			return [];
		} else {
			return [find.id];
		}
	}

	return <div className="NoteList">
		<ContextMenu id='Menu'>
			<div
				className='item'
				onClick={() => {
					if (curNote.title === 'New Note') {
						axios.delete(`/note/${curNote.id}`).catch((err) => {
							console.log(err);
						});
						setLiveNoteList(pre => {
							return pre.filter(item => item.title !== 'New Note');
						});
					} else {
						fakeDeleteNote(curNote);
					}
					setCurNote(null);
					document.getElementById("Menu").style.display = 'none';
				}}
			>
				delete
			</div>
		</ContextMenu>
		<ContextMenu id='Menu2'>
			<div
				className='item'
				onClick={() => {
					Modal.confirm({
						icon: <ExclamationCircleOutlined />,
						content: <ConfirmContent>
							<div className='title' >Are you sure you want to delete the note permanently?</div>
							<div className='subTitle'>You cannot undo this action.</div>
						</ConfirmContent>,
						centered: true,
						okText: 'Delete',
						okButtonProps: { danger: true },
						cancelText: 'Cancel',
						onOk: () => {
							axios
								.delete(`/note/${curNote.id}`)
								.then(() => {
									message.success('delete success');
									getNotes();
								})
								.catch(() => {
									message.error('something wrong');
								});

							setCurNote(null);
							document.getElementById("Menu2").style.display = 'none';
						}
					});
				}}
			>
				delete
			</div>
			<div className='item' onClick={() => {
				let newNote = {
					...curNote,
					deleted: 0,
				}
				updateNoteToServer(newNote, getNotes);
				setCurNote(null);
				document.getElementById("Menu2").style.display = 'none';
			}}>recover</div>
		</ContextMenu>
		<Menu
			defaultOpenKeys={['sub1']}
			mode="inline"
			selectedKeys={getSelectedKeys()}
		>
			<SubMenu key="sub1" icon={<AppstoreOutlined />} title="Notes">
				{
					<DragDropContext
						onDragStart={() => {
							defaultNoteList();
						}}
						onDragEnd={(result) => {
							if (!result.destination) {
								return;
							}

							let ans = Array.from(liveNoteList);
							const [removed] = ans.splice(result.source.index, 1);
							ans.splice(result.destination.index, 0, removed);
							for (let i = 0; i < ans.length; i++) {
								ans[i].number = i;
							}
							setLiveNoteList(ans);

							ans = ans.map(note => {
								return {
									...note,
									content: JSON.stringify(note.content),
								}
							});
							axios.put('/note/updateLiveNoteList', ans);
						}}
					>
						<Droppable droppableId="droppable">
							{(provided, snapshot) => {
								return <div
									{...provided.droppableProps}
									ref={provided.innerRef}
									style={getListStyle(snapshot.isDraggingOver)}
								>
									{liveNoteList.map((note, index) => {
										return <Draggable key={note.id} draggableId={note.id} index={index}>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													style={getItemStyle(
														snapshot.isDragging,
														provided.draggableProps.style,
														note.active
													)}
													onClick={() => {
														handleClickLiveNote(note);
													}}
													// onContextMenu={(e) => {
													// 	handleClickLiveNote(note);
													// 	setCurNote(note);

													// 	e.preventDefault();
													// 	const clickX = e.clientX;
													// 	const clickY = e.clientY;
													// 	const Menu = document.getElementById("Menu");
													// 	Menu.style.display = "block";
													// 	Menu.style.position = "absolute";
													// 	Menu.style.left = `${clickX}px`; Menu.style.top = `${clickY}px`;
													// }}
												>
													{note.title}
												</div>
											)}
										</Draggable>
									})}
									{provided.placeholder}
								</div>
							}}
						</Droppable>
					</DragDropContext>
				}
				{/* {liveNoteList.map((note) => {
					return <Menu.Item key={note.id}
						onClick={() => {
							handleClickLiveNote(note);
						}}
						onContextMenu={(e) => {
							handleClickLiveNote(note);
							setCurNote(note);

							e.preventDefault();
							const clickX = e.clientX;
							const clickY = e.clientY;
							const Menu = document.getElementById("Menu");
							Menu.style.display = "block";
							Menu.style.position = "absolute";
							Menu.style.left = `${clickX}px`; Menu.style.top = `${clickY}px`;
						}}
					>
						<MenuItemContent>
							<div className='title'>{note.title}</div>
							<div className='date'>{note.updateTime.format("yyyy/MM/DD")}</div>
						</MenuItemContent>
					</Menu.Item>
				})} */}
			</SubMenu>
			<SubMenu key="sub2" icon={<DeleteOutlined />} title="Recently Deleted">
				{deletedNoteList.map((note) => {
					return <Menu.Item key={note.id}
						onClick={() => {
							handleClickDeletedNote(note);
						}}
						onContextMenu={(e) => {
							handleClickDeletedNote(note);
							setCurNote(note);

							e.preventDefault();
							const clickX = e.clientX;
							const clickY = e.clientY;
							const Menu = document.getElementById("Menu2");
							Menu.style.display = "block";
							Menu.style.position = "absolute";
							Menu.style.left = `${clickX}px`;
							Menu.style.top = `${clickY}px`;
						}}
					>
						<MenuItemContent>
							<div className='title'>{note.title}</div>
							<div className='date'>{note.updateTime.format("yyyy/MM/DD")}</div>
						</MenuItemContent>
					</Menu.Item>
				})}
			</SubMenu>
		</Menu>
	</div >
};

export default NoteList;
