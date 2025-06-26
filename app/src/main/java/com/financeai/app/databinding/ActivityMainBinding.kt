package com.financeai.app.databinding

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.viewbinding.ViewBinding
import com.financeai.app.R

class ActivityMainBinding private constructor(
    private val rootView: View
) : ViewBinding {

    val webView: WebView = rootView.findViewById(R.id.webView)
    val swipeRefreshLayout: SwipeRefreshLayout = rootView.findViewById(R.id.swipeRefreshLayout)

    override fun getRoot(): View = rootView

    companion object {
        fun inflate(inflater: LayoutInflater): ActivityMainBinding {
            return inflate(inflater, null, false)
        }

        fun inflate(inflater: LayoutInflater, parent: ViewGroup?, attachToParent: Boolean): ActivityMainBinding {
            val view = inflater.inflate(R.layout.activity_main, parent, attachToParent)
            return ActivityMainBinding(view)
        }
    }
}