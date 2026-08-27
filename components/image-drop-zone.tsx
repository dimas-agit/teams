"use client"

import { X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface ImageDropzoneProps{
    value: string[];
    onChange: (images:string[])=>void;
}

export default function ImageDropzone({
    value,
    onChange
} : ImageDropzoneProps){

    const[uploading, setUploading] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[])=>{
            if(!acceptedFiles.length) return;
            setUploading(true);

            try{

                const formData = new FormData();
                acceptedFiles.forEach((file)=>{
                    formData.append("files",file);
                });

                const response = await fetch("/api/upload",{
                    method:"POST",
                    body: formData
                });

                if(!response.ok){
                    throw new Error("Failed to upload images");
                }

                const result: {urls:string[]} = await response.json();
                onChange([...value,...result.urls]);
            }catch(err){
                console.error("Upload error:",err);
            }finally{
                setUploading(false);
            }
            
        },[value,onChange]
    );

    const {getRootProps,getInputProps,isDragActive} = useDropzone({
        onDrop,
        accept:{
            "image/jpg":[".jpg",".jpeg"],
            "image/png":[".png"],
            "image/wep":[".webp"],
        },
        multiple:true,
        maxSize:5*1024*1024,
    });

    const removeImage = (index:number)=>{
        onChange(value.filter((_,i)=>i!==index));
    };

    return (
        <div>
            <div {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ?"border-primary bg-primary":"border-gray-300"}`}>
                    <input {...getInputProps()} />

                    {uploading ?(
                        <p>Uploading...</p>
                    ): isDragActive ?(
                        <p>Drop images here...</p>
                    ) :(
                    <>
                           <p>Drag & drop images here</p>
                            <p className="text-sm text-gray-500">
                            or click to select multiple images
                            </p>
                    </>)}
                
            </div>
            {value.length >0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {value.
                    filter((url) => url?.trim())
                    .map((url,index)=>(
                        <div key={url} className="relative">
                          <img
                            src={`/api/files?url=${encodeURIComponent(url)}`}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={()=>window.open(`/api/files?url=${encodeURIComponent(url)}`,"_blank")}
                        />

                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6"
                        >
                             <X />
                        </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}