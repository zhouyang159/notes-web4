import React, { useState } from "react";
import { message, Menu, Modal } from "antd";
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined, LockFilled } from "@ant-design/icons";
import styled from "styled-components";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import moment from "moment";
import SetNotePwModal from "./modals/SetNotePwModal";
import { NOTES } from "../CONSTANT";

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
	const { profile, getProfile, newId, liveNoteList = [], setLiveNoteList, deletedNoteList = [], setDeletedNoteList, getNotes, updateNoteToServer, validateNotePassword } = props;

	const queryClient = useQueryClient();
	const deleteMutation = useMutation(
		(note) => {
			return axios.delete(`/note/${note.id}`).catch((err) => {
				message.error("delete note error");
				console.log(err);
			});
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([NOTES]);
				queryClient.refetchQueries(NOTES, { force: true });
			},
		}
	);



	return <>
		<ContextMenu id="Menu">
			<div
				className="item"
				onClick={async () => {
					const moveToTrash = () => {


						deleteMutation.mutate({});




					}

					moveToTrash();
				}}
			>
				move to trash
			</div>
			<div
				className="item"
				onClick={async () => {
					if (profile?.hasNotePassword) {

					} else {
						// set new note password
					}
				}}
			>
				{true ? "remove lock" : "add lock"}
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

						}
					});
				}}
			>
				delete
			</div>
			<div
				className="item"
				onClick={() => {

				}}
			>
				recover
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
														queryClient.setQueryData(NOTES, oldNoteList => {
															const arr = oldNoteList
																.map((item) => {
																	return {
																		...item,
																		active: false,
																	}
																})
																.map((item) => {
																	if (item.id === note.id) {
																		return {
																			...item,
																			active: true,
																		}
																	}
																	return item;
																});

															return arr;
														})

													}}
													onContextMenu={(e) => {
														// hideContextMenu();
														// handleClickLiveNote(note);

														e.preventDefault();
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
									note.active
								)}
								onClick={() => {
								}}
								onContextMenu={(e) => {

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
