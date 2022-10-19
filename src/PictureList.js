import { Button, Table, TableCell, TableRow, TextField } from '@mui/material'
import React, {useRef, useState, useContext} from 'react'
import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from 'scatter-gl';
import * as mpPose from '@mediapipe/pose';
import { PoseContext } from "./Context/index"

export default function PictureList(props) {

  const { dataPoses, addPose, deletePose } = useContext(PoseContext)
  const [dataPosePicture, setDataPosePicture] = useState([])

    const [sudutSikuKiri, setSudutSikuKiri] = useState(0)
    const [sudutSikuKanan, setSudutSikuKanan] = useState(0)
    const imgRef = useRef()
    const canvasScreenShootRef = useRef()
    const scatter_gl = useRef()

    const ANCHOR_POINTS = [[0, 0, 0], [0, 1, 0], [-1, 0, 0], [-1, -1, 0]];

    // console.log('video width', props.video.videoWidth)
    // console.log('video height', props.video.videoHeight)

    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
  }

    const detectPose = async ()=>{
        alert('Detect Pose')
        const model = posedetection.SupportedModels.BlazePose;
        const detectorConfig = {
        runtime: 'tfjs',
        //runtime:'mediapipe',
        enableSmoothing: true,
        //solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
        modelType: 'full'
        };
        const detector = await posedetection.createDetector(model, detectorConfig)
        console.log('poses detector', detector)
        console.log('poses imgRef', imgRef)
        console.log('poses canvasScreenShootRef', canvasScreenShootRef)

        const poses = await detector.estimatePoses(imgRef.current,{maxPoses: 1, flipHorizontal: false});
        console.log('poses', poses)
        let dataTake = {id: props.data.id, img: props.data.img, pose : poses[0]}

        runCalculateAngle(poses[0])
        const videoWidth = imgRef.current.width
        const videoHeight = imgRef.current.height

        imgRef.current.width = videoWidth
        imgRef.current.height= videoHeight

        canvasScreenShootRef.current.width = videoWidth
        canvasScreenShootRef.current.height = videoHeight

        for (const pose of poses) {
            if (pose.keypoints != null) {
              console.log('pose keypoint', pose.keypoints)
                const ctx = canvasScreenShootRef.current.getContext("2d")
                drawKeypoints(pose.keypoints, ctx);
                drawSkeleton(pose.keypoints, pose.id, ctx);
                
            }
            if (pose.keypoints3D != null) {
                detect_scatter(pose.keypoints3D)
                setDataPosePicture(pose.keypoints3D)
            }
        }

       addPose(dataTake)

       
    }

    const [scatterGLHasInitialized, setScatterGLHasInitialized] = useState(false)

    const detect_scatter = async(keypoints)=>{
        const videoWidth = imgRef.current.width
        const videoHeight = imgRef.current.height
        let scatterGL = new scatter.ScatterGL(scatter_gl.current, {
            'rotateOnStart': true,
            'selectEnabled': true,
            'styles': {polyline: {defaultOpacity: 1, deselectedOpacity: 1}}
          });
        setScatterGLHasInitialized(false)
        scatter_gl.current.style =
            `width: ${videoWidth}px; height: ${videoHeight}px;`;
        scatterGL.resize();

        scatter_gl.current.style.display = 'inline-block'
        drawKeypoints3D(keypoints, scatterGL)
        //drawSkatter(scatterGL)

    }

    function drawSkatter(scatterGL){
      const pointsData = [
        [
            90,
            625,
            236
        ],
        [
            72,
            663,
            241
        ],
        [
            72,
            664,
            241
        ],
        [
            72,
            664,
            240
        ],
        [
            92.99895912408829,
            662.1696352958679,
            219.6044921875
        ],
        [
            92.7911102771759,
            663.131594657898,
            220.703125
        ],
        [
            92.66172349452972,
            664.5907163619995,
            219.6044921875
        ],
        [
            -29.202602803707123,
            654.2747616767883,
            212.7685546875
        ],
        [
            61.367057263851166,
            658.87451171875,
            121.76513671875
        ],
        [
            48.20944368839264,
            601.3351082801819,
            225.5859375
        ],
        [
            74.62842017412186,
            601.2267470359802,
            197.1435546875
        ],
        [
            -145.02206444740295,
            465.5728042125702,
            195.6787109375
        ],
        [
            124.02445077896118,
            489.185094833374,
            43.39599609375
        ],
        [
            -174.4110733270645,
            222.77015447616577,
            235.4736328125
        ],
        [
            203.499436378479,
            250.76618790626526,
            27.9083251953125
        ],
        [
            -109.27651077508926,
            31.36405348777771,
            321.2890625
        ],
        [
            282.62168169021606,
            68.84186714887619,
            158.69140625
        ],
        [
            -90.17471969127655,
            -38.93982991576195,
            351.318359375
        ],
        [
            298.48551750183105,
            0.5027037113904953,
            178.5888671875
        ],
        [
            -53.914692252874374,
            -21.845810115337372,
            371.58203125
        ],
        [
            293.76548528671265,
            15.035174787044525,
            205.810546875
        ],
        [
            -89.28846567869186,
            24.31292086839676,
            328.125
        ],
        [
            274.8696804046631,
            56.75738304853439,
            174.4384765625
        ],
        [
            -99.3906781077385,
            -2.7280072681605816,
            52.42919921875
        ],
        [
            99.73794221878052,
            2.957942895591259,
            -53.1005859375
        ],
        [
            -165.79490900039673,
            -362.2514605522156,
            81.6650390625
        ],
        [
            151.4713019132614,
            -385.58900356292725,
            -122.9248046875
        ],
        [
            -304.6584725379944,
            -710.3500962257385,
            -14.39666748046875
        ],
        [
            169.2618429660797,
            -750.6789565086365,
            -249.51171875
        ],
        [
            -319.5453882217407,
            -755.2977204322815,
            -14.70184326171875
        ],
        [
            178.87386679649353,
            -796.8855500221252,
            -254.39453125
        ],
        [
            -298.6215651035309,
            -808.8346123695374,
            108.58154296875
        ],
        [
            291.1500930786133,
            -826.145350933075,
            -171.630859375
        ]
    ]
      const dataset = new scatter.ScatterGL.Dataset(pointsData);
      // scatterGL.setTextRenderMode(()=> {return "Tes"})
      scatterGL.render(dataset);
      const sequences = [
        {
            "indices": [
                0,
                1
            ]
        },
        {
            "indices": [
                0,
                4
            ]
        },
        {
            "indices": [
                1,
                2
            ]
        },
        {
            "indices": [
                2,
                3
            ]
        },
        {
            "indices": [
                3,
                7
            ]
        },
        {
            "indices": [
                4,
                5
            ]
        },
        {
            "indices": [
                5,
                6
            ]
        },
        {
            "indices": [
                6,
                8
            ]
        },
        {
            "indices": [
                9,
                10
            ]
        },
        {
            "indices": [
                11,
                12
            ]
        },
        {
            "indices": [
                11,
                13
            ]
        },
        {
            "indices": [
                11,
                23
            ]
        },
        {
            "indices": [
                12,
                14
            ]
        },
        {
            "indices": [
                14,
                16
            ]
        },
        {
            "indices": [
                12,
                24
            ]
        },
        {
            "indices": [
                13,
                15
            ]
        },
        {
            "indices": [
                15,
                17
            ]
        },
        {
            "indices": [
                16,
                18
            ]
        },
        {
            "indices": [
                16,
                20
            ]
        },
        {
            "indices": [
                15,
                17
            ]
        },
        {
            "indices": [
                15,
                19
            ]
        },
        {
            "indices": [
                15,
                21
            ]
        },
        {
            "indices": [
                16,
                22
            ]
        },
        {
            "indices": [
                17,
                19
            ]
        },
        {
            "indices": [
                18,
                20
            ]
        },
        {
            "indices": [
                23,
                25
            ]
        },
        {
            "indices": [
                23,
                24
            ]
        },
        {
            "indices": [
                24,
                26
            ]
        },
        {
            "indices": [
                25,
                27
            ]
        },
        {
            "indices": [
                26,
                28
            ]
        },
        {
            "indices": [
                27,
                29
            ]
        },
        {
            "indices": [
                28,
                30
            ]
        },
        {
            "indices": [
                27,
                31
            ]
        },
        {
            "indices": [
                28,
                32
            ]
        },
        {
            "indices": [
                29,
                31
            ]
        },
        {
            "indices": [
                30,
                32
            ]
        }
    ]
      scatterGL.setSequences(sequences);
    }

    function drawKeypoints3D(keypoints, scatterGL) {
        const scoreThreshold = 0.6;
        const pointsData = keypoints.map(keypoint => ([keypoint.x*1000, -keypoint.y*1000, -keypoint.z*1000]));
        console.log('pointData', pointsData)
        console.log('keypoints', keypoints.map(keypoint=>({x:keypoint.x*1000,y:keypoint.y*1000,z:keypoint.z*1000})))
        const dataset = new scatter.ScatterGL.Dataset(pointsData);
    
        const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
        scatterGL.setPointColorer((i) => {
          if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
            // hide anchor points and low-confident points.
            return '#ffffff';
          }
          if (i === 0) {
            return '#ff0000' /* Red */;
          }
          if (keypointInd.left.indexOf(i) > -1) {
            return '#00ff00' /* Green */;
          }
          if (keypointInd.right.indexOf(i) > -1) {
            return '#ffa500' /* Orange */;
          }
        });
    
        if (scatterGLHasInitialized) {
          scatterGL.render(dataset);
        } else {
          scatterGL.updateDataset(dataset);
        }
        const connections = posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose);
        console.log('connections', connections)
        const sequences = connections.map(pair => ({indices: pair}));
        console.log('sequences', sequences)
        scatterGL.setSequences(sequences);
        setScatterGLHasInitialized(true)
      }

    function drawKeypoints(keypoints, ctx) {
        // const ctx = canvasRef.current.getContext("2d")
        const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
        
        // console.log('keypointInd', keypointInd)
        for (const i of keypointInd.middle) {
          ctx.fillStyle = 'red';
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    
        for (const i of keypointInd.left) {
          ctx.fillStyle = 'green';
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    
        for (const i of keypointInd.right) {
          ctx.fillStyle = 'orange';
          ctx.strokeStyle = 'orange';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    }

    function drawKeypoint(keypoint, ctx) {
        // If score is null, just show the keypoint.
        const score = keypoint.score != null ? keypoint.score : 1;
        const scoreThreshold = 0.6;
        // const ctx = canvasRef.current.getContext("2d")
        if (score >= scoreThreshold) {
          const circle = new Path2D();
          circle.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
          ctx.fill(circle);
          ctx.stroke(circle);
        }
    }

    const COLOR_PALETTE = [
        '#ffffff', '#800000', '#469990', '#e6194b', '#42d4f4', '#fabed4', '#aaffc3',
        '#9a6324', '#000075', '#f58231', '#4363d8', '#ffd8b1', '#dcbeff', '#808000',
        '#ffe119', '#911eb4', '#bfef45', '#f032e6', '#3cb44b', '#a9a9a9'
      ];

    function drawSkeleton(keypoints, poseId, ctx) {
        // Each poseId is mapped to a color in the color palette.
        // const ctx = canvasRef.current.getContext("2d")
        const color = poseId != null ?
            COLOR_PALETTE[poseId % 20] : 'white';
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
    
        posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose).forEach(([i, j]) => {
          const kp1 = keypoints[i];
          const kp2 = keypoints[j];
    
          // If score is null, just show the keypoint.
          const score1 = kp1.score != null ? kp1.score : 1;
          const score2 = kp2.score != null ? kp2.score : 1;
          const scoreThreshold = 0.1;
    
          if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
          }
        });
    }

    const runCalculateAngle = async(pose)=>{
        if(pose.keypoints[11].score >0.6 && pose.keypoints[13].score >0.6 && pose.keypoints[15].score >0.6)
        {
            console.log('sudutSikuKiriInit')
            let sudutSikuKiri = await calculateAgle(pose.keypoints[11],pose.keypoints[13],pose.keypoints[15])
            console.log('sudutSikuKiriResult', sudutSikuKiri)
            setSudutSikuKiri(sudutSikuKiri)
        }

        if(pose.keypoints[12].score >0.6 && pose.keypoints[14].score >0.6 && pose.keypoints[16].score >0.6)
        {
            let sudutSikuKanan = await calculateAgle(pose.keypoints[12],pose.keypoints[14],pose.keypoints[16])
            console.log('sudutSikuKanan', sudutSikuKanan)
            setSudutSikuKanan(sudutSikuKanan)
        }
    }

    const calculateAgle = (keypoint1, keypoint2, keypoint3)=>{
        console.log('sudutKeypoint1', keypoint1)
        console.log('sudutKeypoint2', keypoint2)
        console.log('sudutKeypoint3', keypoint3)
        let x1 = keypoint1.x;let x2 = keypoint2?.x;let x3 = keypoint3?.x
        let y1 = keypoint1?.y;let y2 = keypoint2?.y;let y3 = keypoint3?.y
        
        let x12 = Math.pow((x1-x2),2);let y12 = Math.pow((y1-y2),2)
        let x32 = Math.pow((x3-x2),2); let y32 = Math.pow((y3-y2),2)
        
        let p1 = Math.sqrt(x12 + y12);
        let sudut1 = Math.asin((y1-y2)/p1)*180/Math.PI
    
        let p2 = Math.sqrt(x32 + y32)
        let sudut2 = Math.asin((y2-y3)/p2)*180/Math.PI
    
        let sudut = sudut1+sudut2
        return sudut
    }
    
    return (
        <div style={{display:"inline-block", margin:2}}>
            <p>Take : {props.index+1}</p>
            <TextField value={props.label} onChange={props.change} placeholder="Masukan Nama Label" />
            <div style={{position:'relative',width:360, height:250}}>
                {
                    props.displayImage ? 
                    <>
                        <img src={props.data.img} ref={imgRef} style={{position:'absolute', width:360, height:250, zIndex:9}} />
                        <canvas ref={canvasScreenShootRef} style={{position:'absolute', width:360, height:250, zIndex:11}} />
                    </>:
                    <>
                        <img src={props.data.img} ref={imgRef} style={{position:'absolute', display:'none', width:360, height:250, zIndex:9}} />
                        <canvas ref={canvasScreenShootRef} style={{position:'absolute', width:360, backgroundColor:'black', height:250, zIndex:11}} />
                    </>
                }
                
            </div>
            <p>Score Pose Detection : {props.data.pose && props.data.pose.length>0 ? Math.floor((props.data.pose[0].score)*100): "-"}</p>
            <p>Siku Kiri : {Math.round(sudutSikuKiri)}</p>
            <p>Siku Kanan : {Math.round(sudutSikuKanan)}</p>
            <Button variant="contained" color="primary" tooltip={JSON.stringify(props.data.pose)} onClick={()=>{
                detectPose()
            }} >Pose Detect</Button>
            <Button variant="contained" color="secondary" onClick={props.deletedata} >Hapus</Button>
            <br/>
            <div style={{border:"1px solid #000"}}>
                <div ref={scatter_gl}></div>
            </div>
            <div>
                <Table>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>x</TableCell>
                        <TableCell>y</TableCell>
                        <TableCell>z</TableCell>
                    </TableRow>
                    {
                        dataPosePicture.map((item,index)=>{
                            let display = false
                            if(index === 11 || index === 12 || index === 23 || index === 24){
                                display = true
                            }
                            return(
                                <>
                                    {display ? 
                                    <TableRow>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{(item.x * 1000).toFixed(0)}</TableCell>
                                        <TableCell>{(item.y * 1000 * -1).toFixed(0)}</TableCell>
                                        <TableCell>{(item.z * 1000 * -1).toFixed(0)}</TableCell>
                                    </TableRow>: null
                                }
                                </>
                                
                            )
                        })
                    }
                </Table>
            </div>
        </div>
    )
}
