package util

/**
import (
	"devops.kweaver-ai.cn/kweaver-aiDevOps/AnyFabric/_git/go-libreofficekit"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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

// ConvertLargeWordToPDF 将Word文档转换为PDF，自动处理大小文件
func ConvertWordToPDF(office *libreofficekit.Office, wordPath string, pdfPath string, options *LargeWordToPDFOptions) error {
	if options == nil {
		options = DefaultLargeWordToPDFOptions()
	}

	// 加载文档获取页数
	doc, err := office.LoadDocument(wordPath)
	if err != nil {
		return fmt.Errorf("failed to load Word document: %v", err)
	}
	totalPages := doc.GetParts()
	doc.Close()
	// 根据页数决定处理方式
	if totalPages <= options.PagesPerChunk { // 小文档使用普通方式
		return convertSingleWordToPDF(office, wordPath, pdfPath, options)
	}

	// 大文档使用libreoffice命令行
	return convertLargeWordWithLibreOffice(wordPath, pdfPath, totalPages, options)
}

// convertLargeWordWithLibreOffice 使用libreoffice命令行处理大文件
func convertLargeWordWithLibreOffice(wordPath, pdfPath string, totalPages int, options *LargeWordToPDFOptions) error {
	// 计算内存限制和并行度
	//memoryPerPage := 3 * 1024 * 1024                            // 3MB per page
	//maxMemory := runtime.GOMAXPROCS(0) * 1024 * 1024 * 1024 * 2 // 每个CPU 2GB内存
	//// 根据总页数和每页内存需求调整Java最大堆大小
	//javaMaxHeap := (totalPages * memoryPerPage) / (1024 * 1024) // 转换为MB
	//if javaMaxHeap > 4096 {                                     // 限制最大不超过4GB
	//	javaMaxHeap = 4096
	//} else if javaMaxHeap < 512 { // 最小不低于512MB
	//	javaMaxHeap = 512
	//}
	//
	//// 根据可用内存调整并行数
	//maxParallel := maxMemory / (memoryPerPage * options.PagesPerChunk)
	//if maxParallel < 1 {
	//	maxParallel = 1
	//} else if maxParallel > runtime.NumCPU() {
	//	maxParallel = runtime.NumCPU()
	//}
	fmt.Println(time.Now(), "=====wordPath==路径=", wordPath)
	fmt.Println(time.Now(), "==wordPath==TO===pdfPath==路径=", pdfPath)
	convertArgs := []string{
		"--headless",
		//"--invisible",
		"--norestore",
		"--nolockcheck",
		"--nodefault",
		"--convert-to", "pdf",
		wordPath,
		"--outdir", filepath.Dir(pdfPath),
	}

	// 执行转换命令
	cmd := exec.Command("libreoffice", convertArgs...)

	// 优化环境变量
	//env := append(os.Environ(),
	//	"SAL_USE_VCLPLUGIN=gen",
	//	fmt.Sprintf("JAVA_TOOL_OPTIONS=-Xmx%dm -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxGCPauseMillis=100", javaMaxHeap),
	//	fmt.Sprintf("OMP_THREAD_LIMIT=%d", maxParallel),
	//	"SAL_DISABLE_OPENCL=1",
	//	"DISPLAY=",
	//	"PYTHONPATH=",
	//	"PYTHONHOME=",
	//	"VCL_HIDE_WINDOWS=1",
	//	"JPEGMEM=512M",
	//	"LC_CTYPE=en_US.UTF-8",
	//	"LANG=en_US.UTF-8",
	//)
	//cmd.Env = env

	// 设置进程优先级
	//cmd.SysProcAttr = &syscall.SysProcAttr{
	//	Setpgid: true,
	//}

	// 执行命令并捕获输出
	//output, err := cmd.CombinedOutput()
	output, err := cmd.Output()
	if err != nil {
		err1 := fmt.Errorf("time.Now()conversion failed: %v\nOutput: %s", err, string(output))
		fmt.Println(time.Now(), "====", err1)
		return err1
	}

	// 检查转换是否完成的函数
	//checkConversion := func(pdfPath string, maxAttempts int, interval time.Duration) error {
	//	for i := 0; i < maxAttempts; i++ {
	//		// 检查文件是否存在
	//		if stat, err := os.Stat(pdfPath); err == nil {
	//			// 检查文件大小是否大于0
	//			if stat.Size() > 0 {
	//				// 尝试打开文件，确保文件写入完成
	//				//if file, err := os.Open(pdfPath); err == nil {
	//				//	file.Close()
	//				//	return nil
	//				//}
	//				return nil
	//			}
	//		}
	//		time.Sleep(interval)
	//	}
	//	err := fmt.Errorf("conversion timeout: PDF file not ready after %v seconds",
	//		float64(maxAttempts)*interval.Seconds())
	//	fmt.Println(time.Now(), "====", err)
	//	return err
	//}

	// 获取生成的PDF文件名（LibreOffice会自动添加.pdf扩展名）
	baseNameWithoutExt := strings.TrimSuffix(filepath.Base(wordPath), filepath.Ext(wordPath))
	fmt.Println(time.Now(), "=====baseNameWithoutExt==路径=", baseNameWithoutExt)
	generatedPdfPath := filepath.Join(filepath.Dir(pdfPath), baseNameWithoutExt+".pdf")
	fmt.Println(time.Now(), "=====generatedPdfPath==路径=", generatedPdfPath)

	// 等待转换完成（最多等待600秒，每5秒检查一次）
	//if err := checkConversion(generatedPdfPath, 120, 5000*time.Millisecond); err != nil {
	//	// 如果超时，收集更多诊断信息
	//	files, _ := filepath.Glob(filepath.Join(filepath.Dir(pdfPath), "*.pdf"))
	//	return fmt.Errorf("conversion timeout: %v\nCommand output: %s\nFiles in directory: %v",
	//		err, string(output), files)
	//}

	// 如果生成的文件名与目标文件名不同，则进行重命名
	if generatedPdfPath != pdfPath {
		// 确保目标文件不存在
		if err := os.Remove(pdfPath); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to remove existing target file: %v", err)
		}
		// 重命名文件
		if err := os.Rename(generatedPdfPath, pdfPath); err != nil {
			return fmt.Errorf("failed to rename output file: %v", err)
		}
		// 再次检查重命名后的文件
		//if err := checkConversion(pdfPath, 10, 2000*time.Millisecond); err != nil {
		//	return fmt.Errorf("renamed file verification failed: %v", err)
		//}
	}

	return nil
}

// convertSingleWordToPDF 转换单个Word文档为PDF
func convertSingleWordToPDF(office *libreofficekit.Office, wordPath string, pdfPath string, options *LargeWordToPDFOptions) error {
	if options == nil {
		options = DefaultLargeWordToPDFOptions()
	}
	doc, err := office.LoadDocument(wordPath)
	if err != nil {
		return fmt.Errorf("failed to load Word document: %v", err)
	}
	defer doc.Close()

	filterOptions := fmt.Sprintf(`{
		"FilterData": {
			"PaperFormat": {"type": "string", "value": "%s"},
			"EmbedFonts": {"type": "boolean", "value": %v},
			"ExportBookmarks": {"type": "boolean", "value": %v},
			"Quality": {"type": "int", "value": %d},
			"Compression": {"type": "boolean", "value": %v},
			"UseLosslessCompression": {"type": "boolean", "value": %v},
			"MaxImageResolution": {"type": "int", "value": 300},
			"ReduceImageResolution": {"type": "boolean", "value": true},
			"PDFVirtualPrinter": {"type": "boolean", "value": true},
			"ForcePageSize": {"type": "boolean", "value": true}
		}
	}`,
		options.PaperSize,
		options.EmbedFonts,
		options.ExportBookmarks,
		options.ImageQuality,
		options.UseCompression,
		!options.UseCompression,
	)

	err = doc.SaveAs(pdfPath, "pdf", filterOptions)
	if err != nil {
		return fmt.Errorf("failed to convert document: %v", err)
	}

	return nil
}

*/
