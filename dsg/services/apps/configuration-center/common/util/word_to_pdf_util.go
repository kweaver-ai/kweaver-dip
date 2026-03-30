package util

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

// LargeWordToPDFOptions 定义大型Word转PDF的选项
type LargeWordToPDFOptions struct {
	// PDF纸张大小，如"A4"、"A3"等
	PaperSize string
	// 是否嵌入字体
	EmbedFonts bool
	// 是否导出书签
	ExportBookmarks bool
	// 转换进度回调函数
	ProgressCallback func(current, total int)
	// 每个分块的页数，默认50页
	PagesPerChunk int
	// 是否使用压缩优化
	UseCompression bool
	// 图片压缩质量(1-100)，默认85
	ImageQuality int
	// 临时文件保留时间（分钟），0表示立即删除
	TempFileRetention int
}

// DefaultLargeWordToPDFOptions 返回默认的转换选项
func DefaultLargeWordToPDFOptions() *LargeWordToPDFOptions {
	return &LargeWordToPDFOptions{
		PaperSize:         "A4",
		EmbedFonts:        true,
		ExportBookmarks:   true,
		PagesPerChunk:     50,
		UseCompression:    true,
		ImageQuality:      85,
		ProgressCallback:  nil,
		TempFileRetention: 0,
	}
}

// LibreOfficePool 定义LibreOffice进程池
type LibreOfficePool struct {
	processes chan struct{}
	mutex     sync.Mutex
}

var (
	pool     *LibreOfficePool
	poolOnce sync.Once
)

// GetLibreOfficePool 获取进程池单例
func GetLibreOfficePool() *LibreOfficePool {
	poolOnce.Do(func() {
		maxProcesses := 4 // 限制最大进程数为4
		if maxProcesses > runtime.NumCPU() {
			maxProcesses = runtime.NumCPU()
		}
		pool = &LibreOfficePool{
			processes: make(chan struct{}, maxProcesses),
		}
		// 预填充进程槽
		for i := 0; i < maxProcesses; i++ {
			pool.processes <- struct{}{}
		}
	})
	return pool
}

// ConvertWordToPDF 将Word文档转换为PDF
func ConvertWordToPDF(ctx context.Context, wordPath string, pdfPath string, options *LargeWordToPDFOptions) error {
	if options == nil {
		options = DefaultLargeWordToPDFOptions()
	}
	return convertLargeWordWithLibreOffice(ctx, wordPath, pdfPath)
}

// convertLargeWordWithLibreOffice 使用libreoffice命令行处理大文件
func convertLargeWordWithLibreOffice(ctx context.Context, wordPath, pdfPath string) error {
	pool := GetLibreOfficePool()

	// 获取进程槽
	select {
	case <-pool.processes:
		defer func() { pool.processes <- struct{}{} }()
	case <-time.After(600 * time.Second):
		return fmt.Errorf("timeout waiting for available process slot")
	}

	// 加锁确保进程独占使用
	//pool.mutex.Lock()
	//defer pool.mutex.Unlock()

	dir := filepath.Join(os.TempDir(), fmt.Sprintf("lo_%s", GetFilenameWithoutExt(wordPath)))
	// 确保输出目录存在
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("word failed to create output directory: %v", err)
	}
	fmt.Println(time.Now(), "==word==soffice==临时=路径==", dir)
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
		"--convert-to", "pdf:writer_pdf_Export",
		"--outdir", filepath.Dir(pdfPath),
		wordPath,
	}
	fmt.Println(time.Now(), "=====wordPath==路径==", wordPath)

	cmd := exec.CommandContext(ctx, "soffice", convertArgs...)
	// 添加环境变量优化
	//cmd.Env = append(os.Environ(),
	//	//"SAL_USE_VCLPLUGIN=gen",    // 使用轻量渲染
	//	"SAL_DISABLE_OPENCL=1",     // 禁用GPU加速
	//	"LIBO_DISABLE_TELEMETRY=1", // 关闭数据收集
	//	"OOO_DISABLE_RECOVERY=1",   // 禁用恢复检查
	//	//"DISPLAY=",                 // 清空DISPLAY变量（关键！）
	//)
	//cmd.SysProcAttr = &syscall.SysProcAttr{
	//	Setpgid:   true,            // 防止成为僵尸进程
	//	Pdeathsig: syscall.SIGKILL, // 父进程退出时终止整个进程组
	//}

	output, err := cmd.Output()
	if err != nil {
		err1 := fmt.Errorf("word conversion failed: %v\nOutput: %s", err, string(output))
		fmt.Println(time.Now(), "====", err1)
		return err1
	}

	fmt.Println(time.Now(), "==wordPath==TO===pdfPath==路径==", pdfPath)
	return nil
}
