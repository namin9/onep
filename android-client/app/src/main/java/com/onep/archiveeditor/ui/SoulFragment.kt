package com.onep.archiveeditor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.onep.archiveeditor.R

class SoulFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_soul, container, false)
        val textView = view.findViewById<TextView>(R.id.fragment_text_view)
        textView.text = "Soul Screen - Rebirth and Talents!"
        return view
    }
}