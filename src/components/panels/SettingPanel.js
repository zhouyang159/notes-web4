import React, { useCallback, useState } from "react";
import { Button, Modal, message, Input, Space } from "antd";
import SetNotePwModal from "../modals/SetNotePwModal";
import ChangeNotePwModal from "../modals/ChangeNotePwModal";
import { useTheme } from "styled-components";
import axios from "axios";


const SettingPanel = ({ profile, getProfile, getNotes, isModalOpen = false, closeModal = () => { } }) => {
   const [editing, setEditing] = useState(false);
   const [isSetNotePwModalOpen, setIsSetNotePwModalOpen] = useState(false);
   const [isChangeNotePwModalOpen, setIsChangeNotePwModalOpen] = useState(false);

   const [nickname, setNickname] = useState(profile?.nickname);

   const submit = () => {
      let newProfile = {
         ...profile,
         nickname: nickname,
      }

      axios
         .put(`/user/profile`, newProfile)
         .then((res) => {
            setEditing(false);
            getProfile();
         });
   }

   return <>
      <Modal
         title={<h1>Profile</h1>}
         open={isModalOpen}
         onCancel={closeModal}
         maskClosable={false}
         footer={null}
      >

         <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <div>
               <span style={{ marginRight: "10px" }}>username:</span>
               <strong>{profile.username}</strong>
            </div>
            <div>
               <span style={{ marginRight: "10px" }}>nickname:</span>
               {
                  !editing && <strong onDoubleClick={() => setEditing(true)}>{profile.nickname || "there is no nickname"}</strong>
               }
               {
                  editing && <Input value={nickname} style={{ width: 200 }} size="small" onChange={(e) => setNickname(e.target.value)} onBlur={submit}></Input>
               }
            </div>
            <div>
               <span style={{ marginRight: "10px" }}>lock note:</span>
               {
                  !profile?.hasNotePassword && <Button
                     type="primary"
                     shape="round"
                     size="small"
                     onClick={() => {
                        setIsSetNotePwModalOpen(true);
                     }}
                  >
                     set password...
                  </Button>
               }
               {
                  profile?.hasNotePassword && <Button
                     type="primary"
                     shape="round"
                     size="small"
                     onClick={() => {
                        setIsChangeNotePwModalOpen(true);
                     }}
                  >
                     change password...
                  </Button>
               }
            </div>


         </Space>
      </Modal>
      {
         isSetNotePwModalOpen && <SetNotePwModal
            isModalOpen={isSetNotePwModalOpen}
            closeModal={() => {
               setIsSetNotePwModalOpen(false);
            }}
            onSuccess={() => {
               message.success("set note password success");
               setTimeout(() => {
                  setIsSetNotePwModalOpen(false);
                  getProfile();
               }, 600);
            }}
         ></SetNotePwModal>
      }
      {
         isChangeNotePwModalOpen && <ChangeNotePwModal
            isModalOpen={isChangeNotePwModalOpen}
            closeModal={() => {
               setIsChangeNotePwModalOpen(false);
            }}
            onSuccess={() => {
               setTimeout(() => {
                  setIsChangeNotePwModalOpen(false);
                  getProfile();
                  getNotes();
               }, 600);
            }}
         ></ChangeNotePwModal>
      }
   </>
}

export default SettingPanel;
