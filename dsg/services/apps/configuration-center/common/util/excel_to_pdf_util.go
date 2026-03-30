package util

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// ConvertExcelToPDF converts Excel file to PDF
func ConvertExcelToPDF(excelPath, pdfPath string) error {
	pool := GetLibreOfficePool()

	// 获取进程槽
	select {
	case <-pool.processes:
		defer func() { pool.processes <- struct{}{} }()
	case <-time.After(480 * time.Second):
		return fmt.Errorf("timeout waiting for available process slot")
	}

	// 加锁确保进程独占使用
	//pool.mutex.Lock()
	//defer pool.mutex.Unlock()

	dir := filepath.Join(os.TempDir(), fmt.Sprintf("lo_%s", GetFilenameWithoutExt(excelPath)))
	// 确保输出目录存在
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("excel failed to create output directory: %v", err)
	}
	fmt.Println(time.Now(), "==excel==soffice==临时=路径==", dir)
	defer os.RemoveAll(dir) // 任务完成后清理

	// 执行转换
	convertArgs := []string{
		"--headless",
		"--invisible",
		//"--accept=\"pipe,name=soffice-pipe-uuid;urp;StarOffice.ServiceManager\" ",
		"-env:UserInstallation=file://" + dir,
		"--norestore",
		"--nolockcheck",
		"--nodefault",
		"--nofirststartwizard",
		"--convert-to", "pdf",
		"--outdir", filepath.Dir(pdfPath),
		excelPath,
	}
	fmt.Println(time.Now(), "=====excelPath==路径===", excelPath)

	cmd := exec.Command("soffice", convertArgs...)
	// 设置环境变量
	//cmd.Env = append(os.Environ(),
	//	"DISPLAY=",                 // 清空显示变量
	//	//"SAL_USE_VCLPLUGIN=gen",    // 轻量渲染
	//	"OOO_DISABLE_RECOVERY=1",   // 禁用恢复检查
	//	"LIBO_DISABLE_TELEMETRY=1", // 关闭数据收集
	//)
	//cmd.SysProcAttr = &syscall.SysProcAttr{
	//	Setpgid: true, // 防止成为僵尸进程
	//}
	output, err := cmd.Output()
	if err != nil {
		err1 := fmt.Errorf("excel conversion failed: %v\nOutput: %s", err, string(output))
		fmt.Println(time.Now(), "====", err1)
		return err1
	}

	fmt.Println(time.Now(), "==excelPath==TO===pdfPath==路径==", pdfPath)
	return nil
}
