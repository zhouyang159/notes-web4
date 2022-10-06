import React, { useState } from "react";
import { message, Menu, Modal } from "antd";
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import styled from "styled-components";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import moment from "moment";

const { SubMenu } = Menu;

const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? "#" : "",
	padding: "8px",
	width: 250
});

const activeBackground = "#bfde3f";

const getItemStyle = (isDragging, draggableStyle, active) => {
	let background = "";
	if (isDragging) {
		background = activeBackground;
	} else if (active) {
		background = activeBackground;
	}

	return {
		background: background,
		...draggableStyle,
		cursor: "default",
	}
};

const DraggableItem = styled.div`
	padding: 12px 8px;
	border-bottom: 1px solid lightgray;
	border-radius: 3px;
	height: 66px;
	overflow: hidden;
	&:hover{
		transition: all 0.2s ;
		background: ${props => activeBackground};
	}
	.title {
		line-height: normal;
		font-weight: bold;
		font-size: 18px;
		display: flex;
		justify-content: space-between;
	}
	.date {
		line-height: normal;
		font-size: 14px;
		color: ${(props) => {
		if (props.dangerText) {
			return "red";
		}
		return "gray";
	}};
	}
`;

const ContextMenu = styled.div`
	display: none;
	background-color: #d9d9d9;
	z-index: 10;
	border-radius: 5px;
	padding: 5px;
	.item {
		&:hover{
			background-color: bisque;
		}
		border-radius: 5px;
		padding: 6px;
		cursor: pointer;
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
	const { profile, newId, liveNoteList, setLiveNoteList, deletedNoteList, setDeletedNoteList, getNotes, updateNoteToServer, openSetNotePwModal } = props;

	const [curNote, setCurNote] = useState(null);

	const defaultNoteList = () => {
		if (newId == null) {
			// newId is null represent that we already create a new note in DB, so we can delete it from DB
			//delete server side empty note.
			liveNoteList.forEach(item => {
				if (item.title === "New Note") {
					axios.delete(`/note/${item.id}`).catch((err) => {
						message.error("delete note error");
						console.log(err);
					});
				}
			});
		}

		setLiveNoteList((pre) => {
			return pre.filter((item) => item.title !== "New Note").map((item) => {
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
		if (note.title === "New Note") {
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

	const hideContextMenu = () => {
		document.getElementById("Menu").style.display = "none";
		document.getElementById("Menu2").style.display = "none";
	}

	const getLockIcon = (note) => {
		if (note.encrypt) {
			if (profile?.lockNote) {
				return <LockOutlined />
			} else {
				return <UnlockOutlined />
			}
		} else {
			return null;
		}
	}


	return <>
		<ContextMenu id="Menu">
			<div
				className="item"
				onClick={() => {
					if (curNote.title === "New Note") {
						axios.delete(`/note/${curNote.id}`).catch((err) => {
							console.log(err);
						});
						setLiveNoteList(pre => {
							return pre.filter(item => item.title !== "New Note");
						});
					} else {
						axios.delete(`/note/fake/${curNote.id}`).then(() => {
							let divId = curNote.id.substring(0, curNote.id.indexOf("-"));
							const element = document.getElementById(divId);
							element.style.background = "red";

							setTimeout(() => {
								element.style.transition = "all 0.4s";
								element.style.padding = 0;
								element.style.height = 0;
								element.style.border = 0;
							}, 10);

							setTimeout(() => {
								getNotes();
							}, 400);
						});
					}
					setCurNote(null);
					document.getElementById("Menu").style.display = "none";
				}}
			>
				move to trash
			</div>
			<div
				className="item"
				onClick={() => {
					if (profile?.hasNotePassword) {
						if (curNote.encrypt) {
							let newNote = {
								...curNote,
								encrypt: false,
							}
							updateNoteToServer(newNote, getNotes);
						} else {
							let newNote = {
								...curNote,
								encrypt: true,
							}
							updateNoteToServer(newNote, getNotes);
						}
					} else {
						openSetNotePwModal();
					}
				}}
			>
				{curNote?.encrypt ? 'remove lock' : 'add lock'}
			</div>
		</ContextMenu>
		<ContextMenu id="Menu2">
			<div
				className="item"
				onClick={() => {
					Modal.confirm({
						icon: <ExclamationCircleOutlined />,
						content: <ConfirmContent>
							<div className="title" >Are you sure you want to delete the note permanently?</div>
							<div className="subTitle">You cannot undo this action.</div>
						</ConfirmContent>,
						centered: true,
						okText: "Delete",
						okButtonProps: { danger: true },
						cancelText: "Cancel",
						onOk: () => {
							axios
								.delete(`/note/${curNote.id}`)
								.then(() => {
									message.success("delete success");
									getNotes();
								})
								.catch(() => {
									message.error("something wrong");
								});

							setCurNote(null);
							document.getElementById("Menu2").style.display = "none";
						}
					});
				}}
			>
				delete
			</div>
			<div
				className="item"
				onClick={() => {
					let newNote = {
						...curNote,
						deleted: 0,
					}
					updateNoteToServer(newNote, getNotes);
					setCurNote(null);
					document.getElementById("Menu2").style.display = "none";
				}}
			>
				recover
			</div>
		</ContextMenu>
		<div className="NoteList">
			<Menu
				defaultOpenKeys={["sub1", "sub2"]}
				mode="inline"
				selectedKeys={getSelectedKeys()}
			>
				<SubMenu key="sub1" icon={<AppstoreOutlined />} title="Notes">
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
							axios.put("/note/updateLiveNoteList", ans);
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
												<DraggableItem
													id={note.id.substring(0, note.id.indexOf("-"))}
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
													onContextMenu={(e) => {
														hideContextMenu();

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
													<div className="title">{note.title} <span>{getLockIcon(note)}</span></div>
													<div className="date">{note.createTime.format("yyyy/MM/DD HH:mm:ss")}</div>
												</DraggableItem>
											)}
										</Draggable>
									})}
									{provided.placeholder}
								</div>
							}}
						</Droppable>
					</DragDropContext>
				</SubMenu>

				<SubMenu key="sub2" icon={<DeleteOutlined />} title="Trash">
					<div
						style={getListStyle(false)}
					>
						{deletedNoteList.map((note) => {
							let remainingDay = moment().diff(note.deleteTime, "days");

							let dangerText = false;
							if (remainingDay < 3) {
								dangerText = true;
							}

							return <DraggableItem
								key={note.id}
								dangerText={dangerText}
								style={getItemStyle(
									false,
									{},
									note.active
								)}
								onClick={() => {
									handleClickDeletedNote(note);
								}}
								onContextMenu={(e) => {
									hideContextMenu();

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
								<div className="title">{note.title}</div>
								<div className="date">{remainingDay} days</div>
							</DraggableItem>
						})}
					</div>
				</SubMenu>
			</Menu>
		</div >
	</>
};

export default NoteList;
