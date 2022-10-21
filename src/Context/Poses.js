import React, { createContext, useState, useEffect } from "react";

export const PoseContext = createContext({});

export default function ProfileProvider(props) {
  const [dataPoses, setDataPoses] = useState([]);
  const [excelExport, setExcelExport] = useState([]);
  
  const addPose = async(pose)=>{
    setDataPoses([...dataPoses, pose])

    let poseField = {}
       pose.pose.keypoints3D.forEach(itemkey=>{
        poseField[itemkey.name+"_x"] = itemkey.x.toFixed(5)
        poseField[itemkey.name+"_y"] = itemkey.y.toFixed(5)
        poseField[itemkey.name+"_z"] = itemkey.z.toFixed(5)
        poseField[itemkey.name+"_score"] = itemkey.score.toFixed(5)  
      })
    let dataItem = Object.assign({}, {id:pose.id,label:""}, poseField)
    console.log('dataItem', dataItem)
    console.log('dataItem pose', pose)
    setExcelExport([...excelExport, dataItem])
  }

  const changeLabel = async(id, label)=>{
    const datachange = dataPoses.map(x=>{
      if(id === x.id){
        return({
          ...x, 
          label
        })
      }
      else{
        return x
      }
      
    })
    console.log('datachange', datachange, id, label)
    setDataPoses(datachange)
  }

  const deletePose = async(id)=>{
    const datachange = dataPoses.filter(x=>x.id !== id)
    setDataPoses(datachange)
  }

return (
  <PoseContext.Provider value={{ dataPoses, excelExport, addPose, deletePose, changeLabel }} {...props} />
);
}