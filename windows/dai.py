import sys
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl

class ChatbotWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("D-AI")
        self.resize(1200, 800)

        browser = QWebEngineView()
        browser.setUrl(QUrl("https://d-ai1.onrender.com"))

        self.setCentralWidget(browser)

app = QApplication(sys.argv)

window = ChatbotWindow()
window.show()

sys.exit(app.exec())