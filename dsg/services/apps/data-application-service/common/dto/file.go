package dto

type File struct {
	FileID   string `json:"file_id" binding:"omitempty,uuid"` // 文件id
	FileName string `json:"file_name"`                        // 文件名称
}

type FileUploadRes struct {
	File
}

type FileDownloadReq struct {
	FileID string `json:"file_id" uri:"file_id" binding:"required,uuid"` // 文件id
}
