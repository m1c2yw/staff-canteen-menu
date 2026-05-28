// 菜单导出功能
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

/**
 * 将指定元素导出为PNG图片
 * @param {string} elementId - 要导出的DOM元素ID
 * @param {string} filename - 文件名（不含扩展名）
 */
export async function exportAsImage(elementId, filename) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('导出元素未找到:', elementId)
    return
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    })
    canvas.toBlob(blob => {
      saveAs(blob, `${filename}.png`)
    })
  } catch (err) {
    console.error('导出失败:', err)
  }
}
