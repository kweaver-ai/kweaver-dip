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

// ConvertExcelToPDF converts Excel file to PDF with given options
func ConvertExcelToPDF(office *libreofficekit.Office, excelPath, pdfPath string) error {
	if office == nil {
		return fmt.Errorf("office instance is nil")
	}

	// 检查输入文件是否存在
	if _, err := os.Stat(excelPath); err != nil {
		return fmt.Errorf("input file not accessible: %v", err)
	}

	// 确保输出目录存在
	if err := os.MkdirAll(filepath.Dir(pdfPath), 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	// 获取sheet数量
	//doc, err := office.LoadDocument(excelPath)
	//if err != nil {
	//	return fmt.Errorf("failed to load document: %v", err)
	//}
	//totalSheets := doc.GetParts()
	//doc.Close()
	//
	//// 优化内存使用
	//const memoryPerSheet = 10 * 1024 * 1024 // 每个sheet预估10MB内存
	//// 动态调整Java堆大小
	//javaMaxHeap := int((float64(totalSheets) * float64(memoryPerSheet)) / float64(1024*1024))
	//if javaMaxHeap > 3096 { // 最大3GB
	//	javaMaxHeap = 3096
	//} else if javaMaxHeap < 256 { // 最小256M
	//	javaMaxHeap = 256
	//}

	//// 优化并行度
	//maxParallel := runtime.NumCPU() / 2 // 使用一半的CPU核心
	//if maxParallel < 1 {
	//	maxParallel = 1
	//}

	// 构建优化的libreoffice转换参数
	convertArgs := []string{
		"--headless",
		"--invisible",
		"--norestore",
		"--nolockcheck",
		"--nodefault",
		"--convert-to", "pdf",
		"--outdir", filepath.Dir(pdfPath),
		excelPath,
	}

	// 创建过滤器选项
	filterData := fmt.Sprintf("calc_pdf_Export:PaperFormat=1")

	// 添加过滤器选项
	convertArgs = append(convertArgs, fmt.Sprintf("--infilter=\"%s\"", filterData))

	fmt.Println(time.Now(), "=====excelPath==路径===", excelPath)
	fmt.Println(time.Now(), "==excelPath=TO==pdfPath==路径===", pdfPath)
	// 执行转换命令
	cmd := exec.Command("libreoffice", convertArgs...)

	// 优化环境变量
	//env := append(os.Environ(),
	//	"SAL_USE_VCLPLUGIN=gen",
	//	fmt.Sprintf("JAVA_TOOL_OPTIONS=-Xmx%dm -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxGCPauseMillis=100", javaMaxHeap),
	//	fmt.Sprintf("OMP_THREAD_LIMIT=%d", maxParallel),
	//	"SAL_DISABLE_OPENCL=1",
	//	"PYTHONPATH=",
	//	"PYTHONHOME=",
	//	"SAL_USE_VCLPLUGIN=gen",
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
		return fmt.Errorf("excel conversion failed: %v\nOutput: %s", err, string(output))
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
	//	return fmt.Errorf("excel conversion timeout: PDF file not ready after %v seconds",
	//		float64(maxAttempts)*interval.Seconds())
	//}

	// 获取生成的PDF文件名（LibreOffice会自动添加.pdf扩展名）
	baseNameWithoutExt := strings.TrimSuffix(filepath.Base(excelPath), filepath.Ext(excelPath))
	generatedPdfPath := filepath.Join(filepath.Dir(pdfPath), baseNameWithoutExt+".pdf")

	// 等待转换完成（最多等待200秒，每4秒检查一次）
	//if err := checkConversion(generatedPdfPath, 50, 4000*time.Millisecond); err != nil {
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
		//if err := checkConversion(pdfPath, 10, 100*time.Millisecond); err != nil {
		//	return fmt.Errorf("renamed file verification failed: %v", err)
		//}
	}
	return nil
}


*/
