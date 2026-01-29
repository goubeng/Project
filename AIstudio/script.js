let globalData = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            globalData = data;
            initDashboard(data);
        })
        .catch(err => console.error("加载数据失败:", err));
});

function initDashboard(data) {
    // 1. 顶栏信息 - 扩展责任体系
    document.getElementById('pName').innerText = data.project_name;
    document.getElementById('pCode').innerText = data.project_code;
    
    if (data.team) {
        if (data.team.leader) {
            document.getElementById('pLeader').innerText = data.team.leader;
        }
        if (data.team.manager) {
            document.getElementById('pManager').innerText = data.team.manager;
        }
        if (data.team.contractor) {
            document.getElementById('pContractor').innerText = data.team.contractor;
        }
    }
    
    document.getElementById('updateTime').innerText = data.update_time;

    // 显示项目总体时间轴
    if (data.project_timeline) {
        const timeline = data.project_timeline;
        const timelineEl = document.getElementById('projectTimeline');
        const progress = Math.round((timeline.elapsed_days / timeline.total_days) * 100);
        
        document.getElementById('timelineText').innerText = 
            `${timeline.start_date} 至 ${timeline.plan_end_date} | 总工期：${timeline.total_days}天 | 已执行：${timeline.elapsed_days}天 (${progress}%)`;
        
        timelineEl.style.display = 'flex';
    }

    // 2. 警报逻辑（增强版：支持督办信息）
    if(data.supervision && data.supervision.need_intervention) {
        document.getElementById('alertBanner').style.display = 'block';
        document.getElementById('supervisionBadge').innerText = `待督办：${data.supervision.pending_count}`;
        
        let alertText = `检测到项目健康分偏低 (${data.health_score}分)，且存在 ${data.risk.high} 项高风险问题`;
        if (data.supervision.last_comment) {
            alertText += `。最近督办：${data.supervision.last_comment_by} 于 ${data.supervision.last_comment_date} 指示："${data.supervision.last_comment}"`;
        }
        document.getElementById('alertDesc').innerText = alertText;
    } else if(data.health_status === 'red' || data.risk.high > 0) {
        document.getElementById('alertBanner').style.display = 'block';
        document.getElementById('alertDesc').innerText = `检测到项目健康分偏低 (${data.health_score}分)，且存在 ${data.risk.high} 项高风险问题，建议立即介入。`;
    }

    // 3. 核心指标
    renderHealthGauge(data.health_score);
    document.getElementById('healthScoreDisplay').innerText = data.health_score;
    
    // 高危标记逻辑
    const healthTag = document.getElementById('healthStatusTag');
    if (data.health_score < 60) {
        healthTag.style.display = 'inline-block';
        healthTag.innerText = '高危';
        healthTag.style.color = '#F53F3F';
        healthTag.style.background = '#FFECE8';
        healthTag.style.borderColor = '#FFDCDC';
    } else if (data.health_score < 80) {
        healthTag.style.display = 'inline-block';
        healthTag.innerText = '预警';
        healthTag.style.color = '#FF7D00';
        healthTag.style.background = '#FFF7E8';
        healthTag.style.borderColor = '#FFE4BA';
    } else {
        healthTag.style.display = 'none';
    }

    document.getElementById('delayDays').innerText = Math.abs(data.progress.gap);
    document.getElementById('highRiskCount').innerText = data.risk.high;
    document.getElementById('fundRate').innerText = data.fund.rate + '%';

    // 4. 全生命周期 (Lifecycle)
    renderLifecycle(data);

    // 5. 关键里程碑 (新增)
    renderMilestones(data);

    // 6. 底部图表 (Dashboard)
    renderBottomCharts(data);
}

// ----------------------------------------------------
// 生命周期模块逻辑
// ----------------------------------------------------
function renderLifecycle(data) {
    const container = document.getElementById('lifecycleSteps');
    let html = '';

    data.stages.forEach((stage, idx) => {
        let nodeClass = '';
        let extraClass = '';
        let iconHtml = idx + 1;
        let dateText = '待定';

        // 状态判断
        if (stage.status === 'completed') {
            nodeClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
            dateText = '已完成';
        } else if (stage.status === 'current') {
            extraClass = 'current-process'; 
            nodeClass = 'selected'; 
            iconHtml = '<i class="fas fa-play" style="font-size:12px;"></i>';
            dateText = '进行中';
        }

        html += `
            <div class="step-node ${nodeClass} ${extraClass}" onclick="openStageDetail(${idx}, this)">
                <div class="step-icon-wrapper">${iconHtml}</div>
                <div class="step-title">${stage.name}</div>
                <div class="step-date">${dateText}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 打开详情面板
function openStageDetail(idx, element) {
    const stage = globalData.stages[idx];
    const panel = document.getElementById('stageDetailPanel');
    
    // UI 选中态切换
    document.querySelectorAll('.step-node').forEach(n => n.classList.remove('selected'));
    element.classList.add('selected');

    // 1. 渲染左侧方块指标
    const metricsContainer = document.getElementById('detailMetrics');
    const metricConfig = [
        { key: 'duration', label: '阶段工期', icon: 'fas fa-clock', color: '#1664FF' },
        { key: 'docs_count', label: '产出文档', icon: 'fas fa-file-alt', color: '#722ED1' },
        { key: 'approval_rate', label: '审批通过率', icon: 'fas fa-check-double', color: '#00B42A' },
        { key: 'risk_count', label: '关联风险', icon: 'fas fa-exclamation-triangle', color: '#FF7D00' }
    ];

    let blocksHtml = '';
    metricConfig.forEach(cfg => {
        const val = stage.metrics[cfg.key] || '--';
        blocksHtml += `
            <div class="metric-square">
                <i class="${cfg.icon} ms-icon" style="color:${cfg.color}"></i>
                <div class="ms-val">${val}</div>
                <div class="ms-label">${cfg.label}</div>
            </div>
        `;
    });
    metricsContainer.innerHTML = blocksHtml;

    // 2. 渲染右侧单列任务清单
    const listContainer = document.getElementById('detailTaskList');
    let listHtml = '';
    
    if (stage.sub_tasks && stage.sub_tasks.length > 0) {
        stage.sub_tasks.forEach(task => {
            let statusClass = 'pending';
            let statusLabel = '未开始';
            let iconClass = 'fa-circle';

            if (task.status === 'done') {
                statusClass = 'done'; statusLabel = '已完成'; iconClass = 'fa-check-circle';
            } else if (task.status === 'delay') {
                statusClass = 'delay'; statusLabel = '已延期'; iconClass = 'fa-exclamation-circle';
            } else if (task.status === 'pending') {
                statusClass = 'pending'; statusLabel = '进行中'; iconClass = 'fa-spinner';
            }

            listHtml += `
                <li class="task-row ${statusClass}">
                    <div class="task-info">
                        <div class="task-icon"><i class="fas ${iconClass}"></i></div>
                        <span class="task-name">${task.name}</span>
                    </div>
                    <span class="task-status">${statusLabel}</span>
                </li>
            `;
        });
    } else {
        listHtml = `<li style="text-align:center; color:#999; padding:20px;">暂无任务数据</li>`;
    }
    listContainer.innerHTML = listHtml;

    panel.style.display = 'block';
}

function closeDetailPanel() {
    document.getElementById('stageDetailPanel').style.display = 'none';
}

// ----------------------------------------------------
// 关键里程碑模块（新增）
// ----------------------------------------------------
function renderMilestones(data) {
    if (!data.milestones || data.milestones.length === 0) {
        document.getElementById('milestoneTimeline').innerHTML = 
            '<div style="text-align:center; color:#999; padding:40px;">暂无里程碑数据</div>';
        return;
    }

    const container = document.getElementById('milestoneTimeline');
    let html = '';

    data.milestones.forEach(milestone => {
        let statusClass = 'pending';
        let statusLabel = '未开始';
        let iconClass = 'fa-circle';
        let delayHtml = '';

        if (milestone.status === 'completed') {
            statusClass = 'completed';
            statusLabel = '已完成';
            iconClass = 'fa-check-circle';
            if (milestone.delay_days > 0) {
                delayHtml = `<span style="color:${milestone.delay_days > 0 ? '#FF7D00' : '#00B42A'}; font-size:12px;">延期${milestone.delay_days}天</span>`;
            }
        } else if (milestone.status === 'delay') {
            statusClass = 'delay';
            statusLabel = '已延期';
            iconClass = 'fa-exclamation-circle';
            delayHtml = `<span class="milestone-delay-tag"><i class="fas fa-exclamation-triangle"></i> 延期${milestone.delay_days}天</span>`;
        } else if (milestone.status === 'pending') {
            statusClass = 'pending';
            statusLabel = '待开始';
            iconClass = 'fa-hourglass-half';
        }

        // 风险指示器
        let riskHtml = '';
        if (milestone.risk_level) {
            riskHtml = `<span class="risk-indicator ${milestone.risk_level}" title="风险等级: ${milestone.risk_level}"></span>`;
        }

        const actualDateDisplay = milestone.actual_date || '--';

        html += `
            <div class="milestone-item ${statusClass}">
                <div class="milestone-name">
                    <i class="fas ${iconClass}"></i>
                    ${milestone.name}
                    ${riskHtml}
                </div>
                
                <div class="milestone-dates">
                    <div class="date-block">
                        <div class="date-label">计划完成</div>
                        <div class="date-value">${milestone.plan_date}</div>
                    </div>
                    <div class="date-block">
                        <div class="date-label">实际完成</div>
                        <div class="date-value actual">${actualDateDisplay}</div>
                    </div>
                </div>
                
                <div class="milestone-status-badge ${statusClass}">
                    ${statusLabel}
                </div>
                
                <div style="min-width: 80px; text-align: right;">
                    ${delayHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ----------------------------------------------------
// 图表渲染
// ----------------------------------------------------

// 顶部健康分仪表
function renderHealthGauge(score) {
    const chart = echarts.init(document.getElementById('healthGauge'));
    const color = score < 60 ? '#F53F3F' : (score < 80 ? '#FF7D00' : '#1664FF');
    
    chart.setOption({
        series: [{
            type: 'gauge',
            startAngle: 90, endAngle: -270,
            pointer: { show: false },
            progress: { 
                show: true, overlap: false, roundCap: true, 
                itemStyle: { color: color }, 
                width: 6
            },
            axisLine: { 
                lineStyle: { 
                    width: 6,
                    color: [[1, '#E5E6EB']] 
                } 
            },
            splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, detail: { show: false },
            data: [{ value: score }]
        }]
    });
    window.addEventListener('resize', () => chart.resize());
}

// 底部图表
function renderBottomCharts(data) {
    // 1. 进度条形图
    const pChart = echarts.init(document.getElementById('chartProgress'));
    pChart.setOption({
        grid: { top: 10, bottom: 0, left: 0, right: 40, containLabel: true },
        xAxis: { type: 'value', max: 100, splitLine:{show:false} },
        yAxis: { type: 'category', data: ['计划', '实际'], axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:'#86909C'} },
        series: [{
            type: 'bar',
            data: [
                { value: data.progress.plan, itemStyle: { color: '#F2F3F5', borderRadius: 4 } },
                { 
                    value: data.progress.actual, 
                    itemStyle: { 
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: '#4080FF'}, {offset: 1, color: '#1664FF'}]),
                        borderRadius: 4
                    } 
                }
            ],
            barWidth: 16,
            label: { show: true, position: 'right', formatter: '{c}%', color: '#1D2129', fontWeight: 600 }
        }]
    });
    document.getElementById('planProgress').innerText = data.progress.plan + '%';
    document.getElementById('actualProgress').innerText = data.progress.actual + '%';

    // 2. 资金环形图 (中心显示百分比)
    const fChart = echarts.init(document.getElementById('chartFund'));
    fChart.setOption({
        title: {
            text: data.fund.rate + '%',
            subtext: '已使用',
            left: 'center',
            top: '38%',
            textStyle: { fontWeight: '800', fontSize: 20, color: '#1D2129' },
            subtextStyle: { fontSize: 12, color: '#86909C' }
        },
        series: [{
            type: 'pie',
            radius: ['65%', '85%'],
            center: ['50%', '50%'],
            label: { show: false },
            data: [
                { value: data.fund.used, name: '已使用', itemStyle: { color: '#1664FF' } },
                { value: data.fund.total - data.fund.used, name: '剩余', itemStyle: { color: '#F2F3F5' } }
            ]
        }]
    });
    document.getElementById('totalFund').innerText = data.fund.total;
    document.getElementById('remainFund').innerText = data.fund.total - data.fund.used;

    // 3. 风险环形图 (带图例)
    const rChart = echarts.init(document.getElementById('chartRisk'));
    rChart.setOption({
        tooltip: { trigger: 'item' },
        legend: {
            orient: 'vertical',
            right: 0,
            top: 'center',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: { fontSize: 12, color: '#4E5969' },
            formatter: function (name) {
                let value = 0;
                if (name === '高风险') value = data.risk.high;
                if (name === '中风险') value = data.risk.medium;
                if (name === '低风险') value = data.risk.low;
                return `${name}   ${value}`;
            }
        },
        series: [{
            name: '风险分布',
            type: 'pie',
            radius: ['50%', '75%'],
            center: ['30%', '50%'],
            avoidLabelOverlap: false,
            label: { show: false },
            data: [
                { value: data.risk.high, name: '高风险', itemStyle: { color: '#F53F3F' } },
                { value: data.risk.medium, name: '中风险', itemStyle: { color: '#FF7D00' } },
                { value: data.risk.low, name: '低风险', itemStyle: { color: '#1664FF' } }
            ]
        }]
    });
    document.getElementById('riskTotal').innerText = data.risk.total;

    // 4. 问题 (DOM)
    document.getElementById('majorIssues').innerText = data.issues.major;
    document.getElementById('openIssues').innerText = data.issues.open;

    // Resize
    window.addEventListener('resize', () => {
        pChart.resize();
        fChart.resize();
        rChart.resize();
    });
}

// ----------------------------------------------------
// Tab切换功能
// ----------------------------------------------------
function switchView(viewName) {
    // 切换Tab状态
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.view-tab[data-view="${viewName}"]`).classList.add('active');
    
    // 切换视图容器
    document.getElementById('stagesView').classList.remove('active');
    document.getElementById('milestonesView').classList.remove('active');
    
    if (viewName === 'stages') {
        document.getElementById('stagesView').classList.add('active');
    } else if (viewName === 'milestones') {
        document.getElementById('milestonesView').classList.add('active');
    }
}