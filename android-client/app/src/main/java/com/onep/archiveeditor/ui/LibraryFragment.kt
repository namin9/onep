package com.onep.archiveeditor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.onep.archiveeditor.R

class LibraryFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_library, container, false)
        val textView = view.findViewById<TextView>(R.id.fragment_text_view)
        textView.text = "Library Screen - Collect monster fragments!"
        return view
    }
}