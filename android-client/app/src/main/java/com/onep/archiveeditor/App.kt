package com.onep.archiveeditor

import android.app.Application
import com.onep.archiveeditor.data.model.GameConfig
import com.onep.archiveeditor.data.model.UserStats

class App : Application() {
    companion object {
        var jwtToken: String? = null
        var currentUserStats: UserStats? = null
        var gameConfig: GameConfig? = null // Added for global access
    }
}