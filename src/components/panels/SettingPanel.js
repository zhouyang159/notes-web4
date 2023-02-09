import React, { useState, useMemo } from "react";
import { Button, Modal, message, Input, Space, Switch } from "antd";
import SetNotePwModal from "../modals/SetNotePwModal";
import ChangeNotePwModal from "../modals/ChangeNotePwModal";
import axios from "axios";
import { HexColorPicker } from "react-colorful";
import { useQueryClient, useQuery, useMutation } from "react-query";
import { PROFILE } from "../../CONSTANT";
import { fetchProfile } from "../../API";
import { debounce } from "debounce";
import styled from "styled-components";
import preval from 'preval.macro'

const ColorBlock = styled.div`
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border: ${({ active = false }) => {
      if (active) {
         return "2px solid gray";
      } else {
         return "2px solid white";
      }
   }};
      background-color: ${(props) => {
      return props.backgroundColor;
   }} ;
`;

const SettingPanel = ({ isModalOpen = false, closeModal = () => { } }) => {
   const [editing, setEditing] = useState(false);
   const [isSetNotePwModalOpen, setIsSetNotePwModalOpen] = useState(false);
   const [isChangeNotePwModalOpen, setIsChangeNotePwModalOpen] = useState(false);

   const [username] = useState(() => localStorage.getItem("username"));
   const queryClient = useQueryClient();
   const { data: profile } = useQuery([PROFILE], () => fetchProfile(username));
   const profileMutation = useMutation(
      (newProfile) => {
         return axios.put(`/user/profile`, newProfile);
      },
      {
         onSuccess: () => {
            queryClient.invalidateQueries([PROFILE]);
         }
      }
   );

   const debounceUpdateProfile = useMemo(() => {
      return debounce((newProfile) => {
         newProfile = {
            ...newProfile,
            backgroundColor: JSON.stringify(newProfile.backgroundColor),
         }
         profileMutation.mutate(newProfile);
      }, 1000)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   let activeColor = profile?.backgroundColor.find((item) => item.active);



   return <>
      <Modal
         title={<h1>Profile</h1>}
         open={isModalOpen}
         onCancel={closeModal}
         maskClosable={false}
         footer={null}
         mask={false}
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
                  editing && <Input value={profile?.nickname} style={{ width: 200 }} size="small"
                     onChange={(e) => {
                        queryClient.setQueriesData([PROFILE], (old) => {
                           return {
                              ...old,
                              nickname: e.target.value,
                           }
                        })
                     }}
                     onBlur={() => {
                        debounceUpdateProfile(profile);
                        setEditing(false);
                     }}
                  ></Input>
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
            <div>background color:</div>
            <div>
               {profile?.backgroundColor?.map((colorItem, idx) => {
                  return <ColorBlock key={idx} backgroundColor={colorItem.color} active={colorItem.active} onClick={() => {
                     let tempArr = profile.backgroundColor.map(_item => {
                        if (colorItem === _item) {
                           return {
                              ..._item,
                              active: true,
                           }
                        }
                        return {
                           ..._item,
                           active: false,
                        }
                     })
                     queryClient.setQueryData([PROFILE], (oldProfile) => {
                        return {
                           ...oldProfile,
                           backgroundColor: tempArr,
                        }
                     });
                     const newProfile = {
                        ...profile,
                        backgroundColor: tempArr,
                     }

                     debounceUpdateProfile(newProfile);
                  }}></ColorBlock>
               })}
            </div>
            <HexColorPicker color={activeColor?.color} onChange={(newColor) => {
               let tempArr = profile.backgroundColor.map(item => {
                  if (activeColor === item) {
                     return {
                        color: newColor,
                        active: true,
                     }
                  }
                  return {
                     ...item,
                     active: false,
                  }
               })

               queryClient.setQueryData([PROFILE], (oldProfile) => {
                  return {
                     ...oldProfile,
                     backgroundColor: tempArr,
                  }
               });

               const newProfile = {
                  ...profile,
                  backgroundColor: tempArr,
               }

               debounceUpdateProfile(newProfile);
            }} />
            <div>
               auto logout: &nbsp; <Switch checked={profile?.autoLogout !== -1} onChange={(checked) => {
                  let newProfile = null;
                  if (checked) {
                     queryClient.setQueriesData([PROFILE], (old) => {
                        newProfile = {
                           ...old,
                           autoLogout: 5,
                        }
                        return newProfile;
                     })
                  } else {
                     queryClient.setQueriesData([PROFILE], (old) => {
                        newProfile = {
                           ...old,
                           autoLogout: -1,
                        }
                        return newProfile;
                     })
                  }

                  debounceUpdateProfile(newProfile);
               }}></Switch>
            </div>
            <div>
               <p>Version: {process.env.REACT_APP_VERSION}</p>
               <p>Build Date: {preval`module.exports = new Date().toLocaleString();`}</p>
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
                  queryClient.invalidateQueries([PROFILE]);
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
                  queryClient.invalidateQueries([PROFILE]);
               }, 600);
            }}
         ></ChangeNotePwModal>
      }
   </>
}

export default SettingPanel;
