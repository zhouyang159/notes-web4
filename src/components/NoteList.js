import React, { useState } from "react";
import { useQuery } from "react-query";
import { message, Menu, Modal } from "antd";
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined, LockFilled } from "@ant-design/icons";
import styled from "styled-components";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import moment from "moment";
import SetNotePwModal from "./modals/SetNotePwModal";
import { NOTES } from "../CONSTANT";
import { fetchNotes } from "../API";


const { SubMenu } = Menu;

const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? "#" : "",
	padding: "8px",
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
	border-bottom: 1px solid lightgrey;
	border-radius: 3px;
	height: 66px;
	overflow: hidden;
	position: relative;
	&:hover{
		transition: all 0.2s ;
		background: ${props => activeBackground};
	}
	.title {
		line-height: normal;
		font-weight: bold;
		font-size: 18px;
		width: 95%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
	.lock_icon {
		position: absolute;
		top: 18px;
		right: 6px;
	}
`;

const ContextMenu = styled.div`
	display: none;
	background-color: #d9d9d9;
	z-index: 50;
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
	const { activeNoteId, setActiveNoteId } = props;

	let { data: noteList = [] } = useQuery([NOTES], fetchNotes);
	const liveNoteList = noteList.filter((item) => item.deleted === 0);
	const deletedNoteList = noteList.filter((item) => item.deleted === 1);


	const queryClient = useQueryClient();
	const reorderMutation = useMutation(
		(newList) => {
			const data = newList.map(note => {
				return {
					...note,
					content: JSON.stringify(note.content),
				}
			});

			queryClient.cancelQueries([NOTES]);
			queryClient.setQueryData([NOTES], (oldData) => {
				return [...newList, ...deletedNoteList]
			});

			return axios.put("/note/updateLiveNoteList", data);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([NOTES]);
			}
		}
	);
	const moveToTrashMutation = useMutation(
		(id) => {
			return axios.delete(`/note/toTrash/${id}`);
		},
		{
			onSuccess: async () => {
				// active the next one note
				let findIdx = -1;
				liveNoteList.find((item, idx) => {
					if (activeNoteId === item.id) {
						findIdx = idx;
						return true;
					}
					return false;
				});

				let newActiveNote = liveNoteList[findIdx + 1];
				if (newActiveNote) {
					setActiveNoteId(newActiveNote.id);
				} else {
					setActiveNoteId(null);
				}

				queryClient.invalidateQueries([NOTES]);
			},
		}
	);
	const recoverNoteMutation = useMutation(
		(id) => {
			const find = deletedNoteList.find((item) => {
				if (item.id === id) {
					return true;
				}
				return false;
			});

			const newNote = {
				...find,
				content: JSON.stringify(find.content),
				deleted: 0,
				updateTime: moment(),
			}
			return axios.put("/note/reorder", newNote);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([NOTES]);
				setActiveNoteId(null);
			}
		}
	);
	const deleteNoteMutation = useMutation(
		(id) => {
			return axios.delete(`/note/${id}`).then(() => {
				message.success("delete success");
			})
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([NOTES], { exact: true });
			}
		}
	);

	const hideContextMenu = () => {
		const Menu = document.getElementById("Menu");
		Menu.style.display = "none";
		const Menu2 = document.getElementById("Menu2");
		Menu2.style.display = "none";
	}

	return <>
		<ContextMenu id="Menu">
			<div
				className="item"
				onClick={() => {
					moveToTrashMutation.mutate(activeNoteId);
				}}
			>
				move to trash
			</div>
			<div
				className="item"
				onClick={() => {
					// if (profile?.hasNotePassword) {

					// } else {
					// 	// set new note password
					// }
				}}
			>
				{true ? "remove lock" : "add lock"}
			</div>
		</ContextMenu>
		<ContextMenu id="Menu2">
			<div
				className="item"
				onClick={() => {
					recoverNoteMutation.mutate(activeNoteId);
				}}
			>
				recover
			</div>
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
							deleteNoteMutation.mutate(activeNoteId, {
								onSuccess: () => {
									setActiveNoteId(null);
								}
							});
						}
					});
				}}
			>
				delete
			</div>
		</ContextMenu>
		<div className="NoteList">
			<Menu
				defaultOpenKeys={["sub1", "sub2"]}
				mode="inline"
				selectedKeys={[]}
			>
				<SubMenu key="sub1" icon={<AppstoreOutlined />} title="Notes">
					<DragDropContext
						onDragStart={() => {
						}}
						onDragEnd={(result) => {
							if (!result.destination) {
								return;
							}

							let newLiveNoteList = Array.from(liveNoteList);
							const [removed] = newLiveNoteList.splice(result.source.index, 1);
							newLiveNoteList.splice(result.destination.index, 0, removed);
							for (let i = 0; i < newLiveNoteList.length; i++) {
								newLiveNoteList[i].number = i;
							}

							reorderMutation.mutate(newLiveNoteList);
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
														note.id === activeNoteId
													)}
													onClick={() => {
														// const find = liveNoteList.find((item) => {
														// 	if (item.id === activeNoteId) {
														// 		return true;
														// 	}
														// 	return false;
														// });
														// if (find?.title === "New Note") {
														// 	// this note's content is empty, we delete it forever
														// 	axios.delete(`/note/${activeNoteId}`).then(() => {
														// 		queryClient.invalidateQueries([NOTES]);
														// 	})
														// }

														setActiveNoteId(note.id);
													}}
													onContextMenu={(e) => {
														e.preventDefault();
														hideContextMenu();
														setActiveNoteId(note.id);

														const clickX = e.clientX;
														const clickY = e.clientY;
														const Menu = document.getElementById("Menu");
														Menu.style.display = "block";
														Menu.style.position = "absolute";
														Menu.style.left = `${clickX}px`; Menu.style.top = `${clickY}px`;
													}}
												>
													<div className="title">{note.title}</div>
													<div className="date">{note.createTime.format("yyyy/MM/DD HH:mm:ss")}</div>
													<div className="lock_icon">icon</div>
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
							let eraseDate = moment(note.deleteTime).add(11, "days");
							let remainingDay = eraseDate.diff(moment(), "days");

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
									note.id === activeNoteId,
								)}
								onClick={() => {
									setActiveNoteId(note.id);
								}}
								onContextMenu={(e) => {
									hideContextMenu();
									setActiveNoteId(note.id);

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
								<div className="lock_icon">icon</div>
							</DraggableItem>
						})}
					</div>
				</SubMenu>
			</Menu>
		</div >
	</>
};

export default NoteList;
