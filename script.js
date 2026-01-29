let globalData = null;

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            globalData = data;
            initDashboard(data);
        });
});

function initDashboard(data) {
    // 基础信息
    document.getElementById('pName').innerText = data.project_name;
    document.getElementById('pCode').innerText = data.project_code;
    document.getElementById('updateTime').innerText = data.update_time;
    
    // 顶部仪表
    renderGauge(data.health_score);
    document.getElementById('healthScoreDisplay').innerText = data.health_score;
    
    // 关键KPI
    document.getElementById('delayDays').innerText = Math.abs(data.progress.gap);
    document.getElementById('highRiskCount').innerText = data.risk.high;
    document.getElementById('fundRate').innerText = data.fund.rate + '%';
    
    // 警报
    if(data.health_status === 'red' || data.risk.high > 0) {
        document.getElementById('alertBanner').style.display = 'block';
        document.getElementById('alertDesc').innerText = `健康评分偏低 (${data.health_score}分)，存在 ${data.risk.high} 项高风险问题需要立即处置。`;
    }

    // 渲染生命周期
    renderLifecycle(data);

    // 渲染底部图表
    renderBottomCharts(data);
}

// 渲染生命周期 Steps
function renderLifecycle(data) {
    const container = document.getElementById('lifecycleSteps');
    let html = '';

    data.stages.forEach((stage, idx) => {
        let nodeClass = '';
        let iconHtml = idx + 1;
        let dateText = '待定';
        
        // 状态判断
        if (stage.status === 'completed') {
            nodeClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
            dateText = '2025/08/15'; // 示例数据
        } else if (stage.status === 'current') {
            nodeClass = 'selected'; // 当前选中样式
            dateText = '进行中';
        }

        html += `
            <div class="step-node ${nodeClass}" onclick="openStageDetail(${idx}, this)">
                <div class="step-icon-wrapper">${iconHtml}</div>
                <div class="step-title">${stage.name}</div>
                <div class="step-date">${dateText}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 打开详情面板 (包含方块指标和单列清单)
function openStageDetail(idx, el) {
    const stage = globalData.stages[idx];
    const panel = document.getElementById('stageDetailPanel');
    const metricsContainer = document.getElementById('detailMetrics');
    const listContainer = document.getElementById('detailTaskList');
    
    // UI选中态
    document.querySelectorAll('.step-node').forEach(n => n.classList.remove('selected'));
    el.classList.add('selected');

    // 1. 渲染左侧方块指标 (Square Blocks)
    // 图标映射
    const icons = {
        "duration": "fas fa-clock",
        "docs_count": "fas fa-file-alt",
        "approval_rate": "fas fa-check-double",
        "risk_count": "fas fa-exclamation-triangle"
    };
    const labels = {
        "duration": "工期", "docs_count": "文档", "approval_rate": "通过率", "risk_count": "风险"
    };

    let metricsHtml = '';
    // 强制显示几个固定的指标以展示效果
    const displayKeys = ['duration', 'docs_count', 'approval_rate'];
    displayKeys.forEach(key => {
        const val = stage.metrics[key] || '--';
        const icon = icons[key] || 'fas fa-chart-bar';
        const label = labels[key] || key;
        
        metricsHtml += `
            <div class="metric-square">
                <i class="${icon} ms-icon"></i>
                <div class="ms-val">${val}</div>
                <div class="ms-label">${label}</div>
            </div>
        `;
    });
    // 补充一个满意度方块
    metricsHtml += `
        <div class="metric-square">
            <i class="fas fa-smile ms-icon"></i>
            <div class="ms-val">--</div>
            <div class="ms-label">满意度</div>
        </div>
    `;
    metricsContainer.innerHTML = metricsHtml;

    // 2. 渲染右侧单列清单
    let listHtml = '';
    if(stage.sub_tasks) {
        stage.sub_tasks.forEach(task => {
            let statusClass = 'pending';
            let statusText = '待定';
            let iconClass = 'fa-circle';
            
            if(task.status === 'done') {
                statusClass = 'done'; statusText = '已完成'; iconClass = 'fa-check-circle';
            } else if(task.status === 'delay') {
                statusClass = 'delay'; statusText = '已延期'; iconClass = 'fa-exclamation-circle';
            } else {
                statusText = '进行中'; iconClass = 'fa-spinner';
            }

            listHtml += `
                <li class="task-row ${statusClass}">
                    <div class="task-info">
                        <div class="task-icon"><i class="fas ${iconClass}"></i></div>
                        <span class="task-name">${task.name}</span>
                    </div>
                    <span class="task-status-text t-${statusClass}">${statusText}</span>
                </li>
            `;
        });
    }
    listContainer.innerHTML = listHtml;

    // 显示面板
    panel.style.display = 'block';
}

// 关闭详情面板
function closeDetailPanel() {
    document.getElementById('stageDetailPanel').style.display = 'none';
    // 移除选中态
    document.querySelectorAll('.step-node').forEach(n => n.classList.remove('selected'));
}

// 顶部仪表 (配色匹配)
function renderGauge(score) {
    const chart = echarts.init(document.getElementById('healthGauge'));
    const color = score < 60 ? '#F53F3F' : (score < 80 ? '#FF7D00' : '#1664FF');
    chart.setOption({
        series: [{
            type: 'gauge',
            startAngle: 90, endAngle: -270,
            pointer: { show: false },
            progress: { show: true, overlap: false, roundCap: true, itemStyle: { color: color }, width: 10 },
            axisLine: { lineStyle: { width: 10, color: [[1, '#F2F3F5']] } },
            splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, detail: { show: false },
            data: [{ value: score }]
        }]
    });
}

// 底部图表 (保持原样或微调颜色)
function renderBottomCharts(data) {
    // 进度图
    const pChart = echarts.init(document.getElementById('chartProgress'));
    pChart.setOption({
        grid: { top: 0, bottom: 0, left: 0, right: 30, containLabel: true },
        xAxis: { type: 'value', max: 100, splitLine:{show:false} },
        yAxis: { type: 'category', data: ['计划', '实际'], axisLine:{show:false}, axisTick:{show:false} },
        series: [{
            type: 'bar',
            data: [{value: data.progress.plan, itemStyle:{color:'#F2F3F5'}}, {value: data.progress.actual, itemStyle:{color:'#1664FF'}}],
            barWidth: 12, label: { show: true, position: 'right' }, itemStyle: { borderRadius: 4 }
        }]
    });

    // 资金图
    const fChart = echarts.init(document.getElementById('chartFund'));
    fChart.setOption({
        series: [{
            type: 'pie', radius: ['60%', '80%'], center: ['50%', '50%'], label: { show: false },
            data: [{ value: data.fund.used, itemStyle: { color: '#1664FF' } }, { value: data.fund.total - data.fund.used, itemStyle: { color: '#F2F3F5' } }]
        }]
    });

    // 风险条
    document.getElementById('barHigh').style.width = (data.risk.high / data.risk.total * 100) + '%';
    document.getElementById('barMed').style.width = '30%';
    document.getElementById('barLow').style.width = '20%';
    document.getElementById('valHigh').innerText = data.risk.high;
    document.getElementById('valMed').innerText = 4;
    document.getElementById('valLow').innerText = 6;
    document.getElementById('riskTotal').innerText = data.risk.total;

    // 问题
    document.getElementById('majorIssues').innerText = data.issues.major;
    document.getElementById('openIssues').innerText = data.issues.open;
}